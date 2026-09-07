<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Modules\User\Persistence\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_validation_fails_on_empty_fields(): void
    {
        $response = $this->postJson('/api/v1/auth/register', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['username', 'email', 'password', 'first_name', 'last_name']);
    }

    public function test_registration_validation_fails_on_duplicate_username_or_email(): void
    {
        $this->seed();

        $existingUser = User::first();

        $response = $this->postJson('/api/v1/auth/register', [
            'username' => $existingUser->username,
            'email' => $existingUser->email,
            'password' => 'Secret123!',
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['username', 'email']);
    }

    public function test_registration_succeeds_with_valid_payload(): void
    {
        $this->seed();

        $response = $this->postJson('/api/v1/auth/register', [
            'username' => 'newstaff',
            'email' => 'newstaff@smartpos.com',
            'password' => 'Secret123!',
            'first_name' => 'New',
            'last_name' => 'Staff',
            'phone' => '+85512999000',
            'role' => 'CASHIER',
        ]);

        $response->assertStatus(201);
        $response->assertJson(['success' => true]);
        $this->assertDatabaseHas('users', ['username' => 'newstaff']);
    }

    public function test_login_validation_fails_on_invalid_credentials(): void
    {
        $this->seed();

        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'admin',
            'password' => 'WrongPassword123',
        ]);

        $response->assertStatus(422);
    }

    public function test_login_succeeds_with_correct_credentials(): void
    {
        $this->seed();

        $user = User::where('username', 'admin')->first();
        if (!$user) {
            $statusId = \App\Modules\Settings\Persistence\Models\SysStatus::first()->id ?? 1;
            $user = User::create([
                'username' => 'admin',
                'email' => 'admin@smartpos.com',
                'password' => Hash::make('Admin@123456'),
                'status_id' => $statusId,
            ]);
        } else {
            $user->update(['password' => Hash::make('Admin@123456')]);
        }

        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'admin',
            'password' => 'Admin@123456',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
    }

    public function test_send_and_verify_otp_flow(): void
    {
        $sendRes = $this->postJson('/api/v1/auth/send-otp', [
            'type' => 'register',
            'identifier' => 'testuser@smartpos.com',
        ]);

        $sendRes->assertStatus(200);
        $sendRes->assertJsonStructure(['success', 'otp_code']);
        $otpCode = $sendRes->json('otp_code');

        // Invalid code check
        $failVerify = $this->postJson('/api/v1/auth/verify-otp', [
            'type' => 'register',
            'identifier' => 'testuser@smartpos.com',
            'otp_code' => '000000',
        ]);
        $failVerify->assertStatus(422);

        // Valid code verify
        $successVerify = $this->postJson('/api/v1/auth/verify-otp', [
            'type' => 'register',
            'identifier' => 'testuser@smartpos.com',
            'otp_code' => $otpCode,
        ]);
        $successVerify->assertStatus(200);
        $successVerify->assertJson(['success' => true]);
    }

    public function test_full_registration_and_activation_flow(): void
    {
        $this->seed();

        // 1. Register account -> status: PENDING_VERIFICATION
        $regRes = $this->postJson('/api/v1/auth/register', [
            'username' => 'staff_pending',
            'email' => 'staff_pending@smartpos.com',
            'password' => 'Secret123!',
            'confirm_password' => 'Secret123!',
            'first_name' => 'Pending',
            'last_name' => 'Staff',
            'accept_terms' => true,
        ]);

        $regRes->assertStatus(201);
        $otpCode = $regRes->json('otp_code');
        $this->assertNotEmpty($otpCode);

        // 2. Verify Registration OTP -> activates user account
        $verifyRes = $this->postJson('/api/v1/auth/verify-registration-otp', [
            'identifier' => 'staff_pending@smartpos.com',
            'otp_code' => $otpCode,
        ]);

        $verifyRes->assertStatus(200);
        $verifyRes->assertJson(['success' => true]);

        // 3. Login with newly activated user
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'username' => 'staff_pending',
            'password' => 'Secret123!',
        ]);

        $loginRes->assertStatus(200);
        $loginRes->assertJson(['success' => true]);
    }

    public function test_forgot_password_and_short_lived_token_reset_flow(): void
    {
        $this->seed();

        // 1. Initiate forgot password
        $forgotRes = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'admin@smartpos.com',
        ]);

        $forgotRes->assertStatus(200);
        $otpCode = $forgotRes->json('otp_code');

        // 2. Verify Reset OTP -> receives short-lived reset_token
        $verifyRes = $this->postJson('/api/v1/auth/verify-reset-otp', [
            'identifier' => 'admin@smartpos.com',
            'otp_code' => $otpCode,
        ]);

        $verifyRes->assertStatus(200);
        $resetToken = $verifyRes->json('reset_token');
        $this->assertNotEmpty($resetToken);

        // 3. Reset password using valid reset_token
        $resetRes = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'admin@smartpos.com',
            'reset_token' => $resetToken,
            'new_password' => 'NewAdminPassword123!',
            'confirm_password' => 'NewAdminPassword123!',
        ]);

        $resetRes->assertStatus(200);
        $resetRes->assertJson(['success' => true]);

        // 4. Verify login with new password
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'username' => 'admin',
            'password' => 'NewAdminPassword123!',
        ]);

        $loginRes->assertStatus(200);
    }

    public function test_oauth_redirect_and_callback(): void
    {
        $redirectRes = $this->getJson('/api/v1/auth/oauth/google/redirect');
        $redirectRes->assertStatus(200);
        $redirectRes->assertJson(['success' => true, 'provider' => 'google']);

        $callbackRes = $this->postJson('/api/v1/auth/oauth/telegram/callback');
        $callbackRes->assertStatus(200);
        $callbackRes->assertJson(['success' => true]);
    }
}
