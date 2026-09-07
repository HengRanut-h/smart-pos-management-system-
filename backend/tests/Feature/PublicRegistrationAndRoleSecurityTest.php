<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Modules\User\Persistence\Models\User;
use App\Modules\Role\Persistence\Models\Role;
use App\Modules\Customer\Persistence\Models\Customer;
use App\Modules\Authentication\Persistence\Models\OtpVerification;
use App\Modules\Audit\Persistence\Models\AuditLog;
use App\Modules\Settings\Persistence\Models\SysStatus;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PublicRegistrationAndRoleSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /**
     * Test 1 — Normal Registration
     * Register -> OTP -> Verify => role = customer, status = ACTIVE
     */
    public function test_normal_public_registration_flow_assigns_customer_role(): void
    {
        // 1. Submit public registration
        $regRes = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'username' => 'johndoe',
            'email' => 'john.doe@example.com',
            'phone' => '+85512345678',
            'password' => 'Password123!',
            'confirm_password' => 'Password123!',
            'accept_terms' => true,
            'channel' => 'EMAIL',
        ]);

        $regRes->assertStatus(201);
        $regRes->assertJson([
            'success' => true,
            'data' => [
                'role' => 'customer',
                'status' => 'PENDING_VERIFICATION',
                'registration_source' => 'public',
            ],
        ]);

        $user = User::where('email', 'john.doe@example.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('public', $user->registration_source);
        $this->assertNotNull($user->customer_id);
        $this->assertNull($user->employee_id);
        $this->assertTrue($user->hasRole('CUSTOMER'));
        $this->assertFalse($user->hasRole('ADMIN'));

        // 2. Fetch OTP and verify
        $otpRecord = OtpVerification::where('destination', 'john.doe@example.com')->latest()->first();
        $this->assertNotNull($otpRecord);
        $otpCode = $regRes->json('otp_code');

        $verifyRes = $this->postJson('/api/v1/auth/verify-registration-otp', [
            'identifier' => 'john.doe@example.com',
            'otp_code' => $otpCode,
        ]);

        $verifyRes->assertStatus(200);
        $verifyRes->assertJson(['success' => true]);

        $user = $user->fresh();
        $activeStatusId = SysStatus::where('domain', 'USER')->where('code', 'ACTIVE')->value('id');
        $this->assertEquals($activeStatusId, $user->status_id);
        $this->assertTrue($user->hasRole('CUSTOMER'));
    }

    /**
     * Test 2 — Malicious Admin Registration
     * Submitting {"role": "admin"} must be ignored/rejected and strictly result in role = customer
     */
    public function test_malicious_admin_registration_forces_customer_role(): void
    {
        $res = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Hacker',
            'last_name' => 'Admin',
            'username' => 'hacker_admin',
            'email' => 'hacker@example.com',
            'password' => 'HackerPassword123!',
            'role' => 'admin',
            'role_id' => 1,
            'is_admin' => true,
            'is_super_admin' => true,
            'channel' => 'EMAIL',
        ]);

        $res->assertStatus(201);
        $res->assertJson([
            'success' => true,
            'data' => [
                'role' => 'customer',
            ],
        ]);

        $user = User::where('email', 'hacker@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('CUSTOMER'));
        $this->assertFalse($user->hasRole('ADMIN'));
        $this->assertFalse($user->hasRole('SUPER_ADMIN'));
    }

    /**
     * Test 3 — Malicious Super Admin Registration
     * Submitting {"role": "super_admin"} must strictly result in role = customer
     */
    public function test_malicious_super_admin_registration_forces_customer_role(): void
    {
        $res = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Super',
            'last_name' => 'Hacker',
            'username' => 'super_hacker',
            'email' => 'superhacker@example.com',
            'password' => 'HackerPassword123!',
            'role' => 'super_admin',
            'channel' => 'EMAIL',
        ]);

        $res->assertStatus(201);
        $user = User::where('email', 'superhacker@example.com')->first();
        $this->assertTrue($user->hasRole('CUSTOMER'));
        $this->assertFalse($user->hasRole('SUPER_ADMIN'));
    }

    /**
     * Test 4 — Admin Role Assignment
     * Authorized admin assigns customer -> cashier, records audit log
     */
    public function test_authorized_admin_can_assign_cashier_role_with_audit_log(): void
    {
        // Setup admin user with session token
        $admin = User::whereHas('roles', fn($q) => $q->where('code', 'ADMIN'))->first();
        if (!$admin) {
            $admin = User::create([
                'username' => 'test_admin_user',
                'email' => 'admin_test@smartpos.com',
                'password' => Hash::make('Admin123!'),
                'status_id' => 1,
            ]);
            $adminRole = Role::where('code', 'ADMIN')->first();
            $admin->roles()->sync([$adminRole->id]);
        }
        $authService = app(\App\Modules\Authentication\Application\Services\AuthService::class);
        $adminSession = $authService->createSession($admin);

        // Setup customer user
        $customerUser = User::create([
            'username' => 'promoted_cust',
            'email' => 'cust@example.com',
            'password' => Hash::make('secret'),
            'status_id' => 1,
        ]);
        $customerRole = Role::where('code', 'CUSTOMER')->first();
        $customerUser->roles()->sync([$customerRole->id]);

        $res = $this->withHeaders([
            'Authorization' => 'Bearer ' . $adminSession['token'],
        ])->postJson("/api/v1/admin/users/{$customerUser->id}/role", [
            'role' => 'CASHIER',
            'branch_id' => 1,
            'reason' => 'Promoted customer to store cashier',
        ]);

        $res->assertStatus(200);
        $res->assertJson([
            'success' => true,
            'data' => [
                'current_role' => 'CASHIER',
            ],
        ]);

        $customerUser = $customerUser->fresh(['roles', 'employee']);
        $this->assertTrue($customerUser->hasRole('CASHIER'));
        $this->assertNotNull($customerUser->employee);
        $this->assertEquals(1, $customerUser->employee->branch_id);

        // Verify audit log
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'action' => 'ROLE_CHANGED',
            'entity_type' => 'USER',
            'entity_id' => $customerUser->id,
        ]);
    }

    /**
     * Test 5 — Unauthorized Role Assignment
     * Customer attempts customer -> admin => 403 Forbidden
     */
    public function test_customer_cannot_assign_roles(): void
    {
        $customerUser = User::create([
            'username' => 'normal_cust',
            'email' => 'normal_cust@example.com',
            'password' => Hash::make('secret'),
            'status_id' => 1,
        ]);
        $customerRole = Role::where('code', 'CUSTOMER')->first();
        $customerUser->roles()->sync([$customerRole->id]);

        $authService = app(\App\Modules\Authentication\Application\Services\AuthService::class);
        $custSession = $authService->createSession($customerUser);

        $res = $this->withHeaders([
            'Authorization' => 'Bearer ' . $custSession['token'],
        ])->postJson("/api/v1/admin/users/{$customerUser->id}/role", [
            'role' => 'ADMIN',
        ]);

        $res->assertStatus(403);
    }

    /**
     * Test 6 — Admin Creates Admin
     * Normal admin cannot promote another user to ADMIN or SUPER_ADMIN (Only SUPER_ADMIN can)
     */
    public function test_normal_admin_cannot_promote_to_admin_or_super_admin(): void
    {
        $admin = User::whereHas('roles', fn($q) => $q->where('code', 'ADMIN'))->first();
        if (!$admin) {
            $admin = User::create([
                'username' => 'test_admin_user_2',
                'email' => 'admin_test_2@smartpos.com',
                'password' => Hash::make('Admin123!'),
                'status_id' => 1,
            ]);
            $adminRole = Role::where('code', 'ADMIN')->first();
            $admin->roles()->sync([$adminRole->id]);
        }
        $authService = app(\App\Modules\Authentication\Application\Services\AuthService::class);
        $adminSession = $authService->createSession($admin);

        $targetUser = User::create([
            'username' => 'target_staff',
            'email' => 'staff@example.com',
            'password' => Hash::make('secret'),
            'status_id' => 1,
        ]);

        // Regular admin tries to assign ADMIN -> 403
        $resAdmin = $this->withHeaders([
            'Authorization' => 'Bearer ' . $adminSession['token'],
        ])->postJson("/api/v1/admin/users/{$targetUser->id}/role", [
            'role' => 'ADMIN',
        ]);
        $resAdmin->assertStatus(403);

        // Regular admin tries to assign SUPER_ADMIN -> 403
        $resSuper = $this->withHeaders([
            'Authorization' => 'Bearer ' . $adminSession['token'],
        ])->postJson("/api/v1/admin/users/{$targetUser->id}/role", [
            'role' => 'SUPER_ADMIN',
        ]);
        $resSuper->assertStatus(403);

        // SUPER_ADMIN can assign ADMIN -> 200
        $superAdmin = User::whereHas('roles', fn($q) => $q->where('code', 'SUPER_ADMIN'))->first();
        if (!$superAdmin) {
            $superAdmin = User::create([
                'username' => 'test_super_user',
                'email' => 'super_test@smartpos.com',
                'password' => Hash::make('Super123!'),
                'status_id' => 1,
            ]);
            $superRole = Role::where('code', 'SUPER_ADMIN')->first();
            $superAdmin->roles()->sync([$superRole->id]);
        }
        $superSession = $authService->createSession($superAdmin);

        auth()->forgetGuards();

        $resSuccess = $this->withHeaders([
            'Authorization' => 'Bearer ' . $superSession['token'],
        ])->postJson("/api/v1/admin/users/{$targetUser->id}/role", [
            'role' => 'ADMIN',
        ]);
        $resSuccess->assertStatus(200);
        $this->assertTrue($targetUser->fresh()->hasRole('ADMIN'));
    }

    /**
     * Test 7 — OTP Constraints
     * Expired OTP rejected, Used OTP rejected, Too many attempts blocked
     */
    public function test_otp_security_constraints_expired_used_and_max_attempts(): void
    {
        $destination = 'security_otp@example.com';

        // 1. Expired OTP
        $expiredOtp = OtpVerification::create([
            'purpose' => 'REGISTRATION',
            'channel' => 'EMAIL',
            'destination' => $destination,
            'otp_hash' => hash('sha256', '123456'),
            'expires_at' => now()->subMinutes(10),
            'attempts' => 0,
        ]);

        $failExpired = $this->postJson('/api/v1/auth/verify-registration-otp', [
            'identifier' => $destination,
            'otp_code' => '123456',
        ]);
        $failExpired->assertStatus(422);
        $failExpired->assertJson(['success' => false]);

        // 2. Max attempts exceeded
        $expiredOtp->update([
            'expires_at' => now()->addMinutes(5),
            'attempts' => 5,
        ]);

        $failAttempts = $this->postJson('/api/v1/auth/verify-registration-otp', [
            'identifier' => $destination,
            'otp_code' => '123456',
        ]);
        $failAttempts->assertStatus(422);
        $failAttempts->assertJson(['success' => false]);

        // 3. Used/Already-verified OTP
        $expiredOtp->update([
            'attempts' => 0,
            'verified_at' => now()->subMinute(),
        ]);

        $failUsed = $this->postJson('/api/v1/auth/verify-registration-otp', [
            'identifier' => $destination,
            'otp_code' => '123456',
        ]);
        $failUsed->assertStatus(422);
    }

    /**
     * Test 8 — Password Reset
     * Attempt without verified OTP rejected; with verified OTP issues secure reset token
     */
    public function test_password_reset_requires_verified_otp_token(): void
    {
        $user = User::create([
            'username' => 'reset_target',
            'email' => 'reset@example.com',
            'password' => Hash::make('OldPassword123!'),
            'status_id' => 1,
        ]);

        // 1. Attempt to reset without valid reset token -> 422
        $badReset = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'reset@example.com',
            'reset_token' => 'invalid_fake_token_12345',
            'new_password' => 'BrandNewPassword123!',
        ]);
        $badReset->assertStatus(422);

        // 2. Request forgot password OTP
        $forgotRes = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'reset@example.com',
        ]);
        $forgotRes->assertStatus(200);

        $otpRecord = OtpVerification::where('destination', 'reset@example.com')
            ->where('purpose', 'PASSWORD_RESET')
            ->latest()
            ->first();
        $this->assertNotNull($otpRecord);

        // Verify with correct OTP -> issues secure reset token
        $verifyRes = $this->postJson('/api/v1/auth/verify-reset-otp', [
            'identifier' => 'reset@example.com',
            'otp_code' => $forgotRes->json('otp_code'),
        ]);
        $verifyRes->assertStatus(200);
        $resetToken = $verifyRes->json('reset_token');
        $this->assertNotEmpty($resetToken);

        // 3. Reset password using valid reset token -> 200
        $goodReset = $this->postJson('/api/v1/auth/reset-password', [
            'reset_token' => $resetToken,
            'new_password' => 'BrandNewPassword123!',
        ]);
        $goodReset->assertStatus(200);

        // Verify password actually updated
        $user = $user->fresh();
        $this->assertTrue(Hash::check('BrandNewPassword123!', $user->password));

        // 4. Using same reset token again -> rejected
        $reuseToken = $this->postJson('/api/v1/auth/reset-password', [
            'reset_token' => $resetToken,
            'new_password' => 'AnotherNewPassword123!',
        ]);
        $reuseToken->assertStatus(422);
    }

    /**
     * Test 9 — Google OAuth Registration
     * User authenticating via Google must automatically receive Customer role,
     * linked Customer record, and registration_source = public.
     */
    public function test_google_oauth_registration_defaults_to_customer_role(): void
    {
        $googleService = app(\App\Modules\Authentication\Application\Services\GoogleAuthService::class);
        $user = $googleService->handleGoogleUser([
            'id' => '1092837465',
            'email' => 'google.user@example.com',
            'name' => 'Google Customer',
            'given_name' => 'Google',
            'family_name' => 'Customer',
            'picture' => 'https://lh3.googleusercontent.com/a/photo',
        ]);

        $this->assertNotNull($user);
        $this->assertEquals('public', $user->registration_source);
        $this->assertNotNull($user->customer_id);
        $this->assertNull($user->employee_id);
        $this->assertTrue($user->hasRole('CUSTOMER'));
        $this->assertFalse($user->hasRole('ADMIN'));
        $this->assertFalse($user->hasRole('SUPER_ADMIN'));
        $this->assertFalse($user->hasRole('CASHIER'));

        $customer = Customer::find($user->customer_id);
        $this->assertNotNull($customer);
        $this->assertEquals('Google Customer', $customer->name);
        $this->assertEquals('google.user@example.com', $customer->email);
    }

    /**
     * Test 10 — Only Admin can assign customers that register by yourself to other roles
     */
    public function test_only_admin_can_assign_self_registered_customer_to_other_roles(): void
    {
        $authService = app(\App\Modules\Authentication\Application\Services\AuthService::class);

        // 1. Create a self-registered customer (e.g. from Google or public register)
        $selfRegisteredCustomer = User::create([
            'username' => 'self_reg_cust',
            'email' => 'self_reg@smartpos.com',
            'password' => Hash::make('secret123'),
            'registration_source' => 'public',
            'status_id' => 1,
        ]);
        $customerRole = Role::where('code', 'CUSTOMER')->first();
        $selfRegisteredCustomer->roles()->sync([$customerRole->id]);

        // 2. Non-admin (Cashier) attempts to assign customer to Manager -> 403
        $cashier = User::create([
            'username' => 'cashier_user',
            'email' => 'cashier@smartpos.com',
            'password' => Hash::make('secret123'),
            'status_id' => 1,
        ]);
        $cashierRole = Role::where('code', 'CASHIER')->first();
        $cashier->roles()->sync([$cashierRole->id]);
        $cashierSession = $authService->createSession($cashier);

        $unauthorizedRes = $this->withHeaders([
            'Authorization' => 'Bearer ' . $cashierSession['token'],
        ])->postJson("/api/v1/admin/users/{$selfRegisteredCustomer->id}/role", [
            'role' => 'MANAGER',
        ]);
        $unauthorizedRes->assertStatus(403);
        $unauthorizedRes->assertJson([
            'success' => false,
            'message' => 'Forbidden. Only administrators can assign customers that register by yourself to other roles.',
        ]);

        // 3. Admin successfully assigns self-registered customer to Manager -> 200
        auth()->forgetGuards();

        $admin = User::whereHas('roles', fn($q) => $q->where('code', 'ADMIN'))->first();
        if (!$admin) {
            $admin = User::create([
                'username' => 'admin_user_test_10',
                'email' => 'admin_10@smartpos.com',
                'password' => Hash::make('Admin123!'),
                'status_id' => 1,
            ]);
            $adminRole = Role::where('code', 'ADMIN')->first();
            $admin->roles()->sync([$adminRole->id]);
        }
        $adminSession = $authService->createSession($admin);

        $authorizedRes = $this->withHeaders([
            'Authorization' => 'Bearer ' . $adminSession['token'],
        ])->postJson("/api/v1/admin/users/{$selfRegisteredCustomer->id}/role", [
            'role' => 'MANAGER',
            'branch_id' => 1,
            'reason' => 'Admin promoted self-registered customer to store manager',
        ]);

        $authorizedRes->assertStatus(200);
        $authorizedRes->assertJson(['success' => true]);

        $selfRegisteredCustomer = $selfRegisteredCustomer->fresh(['roles', 'employee']);
        $this->assertTrue($selfRegisteredCustomer->hasRole('MANAGER'));
        $this->assertNotNull($selfRegisteredCustomer->employee);
        $this->assertEquals(1, $selfRegisteredCustomer->employee->branch_id);

        // 4. Verify audit log entry
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'action' => 'ROLE_CHANGED',
            'entity_type' => 'USER',
            'entity_id' => $selfRegisteredCustomer->id,
        ]);
    }
}
