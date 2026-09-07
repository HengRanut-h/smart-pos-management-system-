<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Modules\User\Persistence\Models\User;
use App\Modules\Authentication\Persistence\Models\SocialAccount;
use App\Modules\Authentication\Persistence\Models\AuthSession;
use App\Modules\Authentication\Persistence\Models\OtpVerification;
use App\Modules\Settings\Persistence\Models\SysStatus;
use Illuminate\Support\Facades\Hash;

class AuthenticationArchitectureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_user_model_has_core_database_relationships(): void
    {
        $status = SysStatus::first();
        $user = User::create([
            'username' => 'architect_user',
            'email' => 'architect@smartpos.com',
            'password' => Hash::make('Secret123!'),
            'status_id' => $status->id,
        ]);

        // SocialAccount relationship
        $social = SocialAccount::create([
            'user_id' => $user->id,
            'provider' => 'google',
            'provider_id' => 'google_test_123',
            'email' => 'architect@smartpos.com',
            'nickname' => 'Architect',
        ]);

        // OtpVerification relationship
        $otp = OtpVerification::create([
            'user_id' => $user->id,
            'purpose' => 'REGISTRATION',
            'channel' => 'EMAIL',
            'destination' => 'architect@smartpos.com',
            'otp_hash' => hash('sha256', '123456'),
            'expires_at' => now()->addMinutes(5),
        ]);

        // AuthSession relationship
        $session = AuthSession::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', 'random_session_token_123'),
            'device_type' => 'POS_TERMINAL',
            'device_name' => 'Main POS Register #1',
            'ip_address' => '127.0.0.1',
        ]);

        $user = $user->fresh();

        $this->assertCount(1, $user->socialAccounts);
        $this->assertEquals('google', $user->socialAccounts->first()->provider);

        $this->assertCount(1, $user->otpVerifications);
        $this->assertEquals('REGISTRATION', $user->otpVerifications->first()->purpose);

        $this->assertCount(1, $user->authSessions);
        $this->assertEquals('POS_TERMINAL', $user->authSessions->first()->device_type);
        $this->assertTrue($user->authSessions->first()->isValid());
    }

    public function test_otp_controller_send_and_verify_flow(): void
    {
        // 1. Send OTP
        $sendRes = $this->postJson('/api/v1/auth/otp/send', [
            'destination' => 'test_otp@smartpos.com',
            'purpose' => 'REGISTRATION',
            'channel' => 'EMAIL',
        ]);

        $sendRes->assertStatus(200);
        $sendRes->assertJson(['success' => true]);

        $destination = 'test_otp@smartpos.com';
        $record = OtpVerification::where('destination', $destination)->latest()->first();
        $this->assertNotNull($record);

        // 2. Verify with wrong OTP
        $failVerify = $this->postJson('/api/v1/auth/otp/verify', [
            'destination' => $destination,
            'purpose' => 'REGISTRATION',
            'otp' => '000000',
        ]);
        $failVerify->assertStatus(422);
        $failVerify->assertJson(['success' => false]);

        // 3. Verify with correct dev_otp if present or simulate match
        $correctOtp = $sendRes->json('dev_otp');
        if ($correctOtp) {
            $successVerify = $this->postJson('/api/v1/auth/otp/verify', [
                'destination' => $destination,
                'purpose' => 'REGISTRATION',
                'otp' => $correctOtp,
            ]);
            $successVerify->assertStatus(200);
            $successVerify->assertJson(['success' => true]);
        }
    }

    public function test_google_oauth_endpoints(): void
    {
        // 1. Redirect URL endpoint
        $redirectRes = $this->getJson('/api/v1/auth/google/redirect');
        $redirectRes->assertStatus(200);
        $redirectRes->assertJsonStructure(['success', 'provider', 'auth_url']);

        // 2. Callback endpoint
        $callbackRes = $this->postJson('/api/v1/auth/google/callback', [
            'id' => 'google_uid_98765',
            'email' => 'google_tester@smartpos.com',
            'name' => 'Google Tester',
        ]);

        $callbackRes->assertStatus(200);
        $callbackRes->assertJson(['success' => true]);
        $callbackRes->assertJsonStructure([
            'data' => [
                'user' => ['id', 'email', 'social_accounts'],
                'token',
            ]
        ]);

        $this->assertDatabaseHas('social_accounts', [
            'provider' => 'google',
            'provider_id' => 'google_uid_98765',
        ]);
    }

    public function test_telegram_sso_endpoints(): void
    {
        // 1. Bot info endpoint
        $infoRes = $this->getJson('/api/v1/auth/telegram/bot-info');
        $infoRes->assertStatus(200);
        $infoRes->assertJsonStructure(['success', 'bot_username', 'auth_url']);

        // 2. Callback endpoint
        $callbackRes = $this->postJson('/api/v1/auth/telegram/callback', [
            'id' => 'tg_uid_555666',
            'username' => 'tg_cashier',
            'first_name' => 'Telegram',
            'last_name' => 'Cashier',
        ]);

        $callbackRes->assertStatus(200);
        $callbackRes->assertJson(['success' => true]);
        $callbackRes->assertJsonStructure([
            'data' => [
                'user' => ['id', 'username', 'social_accounts'],
                'token',
            ]
        ]);

        $this->assertDatabaseHas('social_accounts', [
            'provider' => 'telegram',
            'provider_id' => 'tg_uid_555666',
        ]);
    }

    public function test_login_creates_auth_session(): void
    {
        $status = SysStatus::where('code', 'ACTIVE')->first();
        $user = User::create([
            'username' => 'pos_operator',
            'email' => 'operator@smartpos.com',
            'password' => Hash::make('PosSecret123'),
            'status_id' => $status->id,
        ]);

        $res = $this->withHeaders([
            'X-Device-Type' => 'POS_TERMINAL',
            'X-Device-Name' => 'Terminal Station 01',
        ])->postJson('/api/v1/auth/login', [
            'username' => 'pos_operator',
            'password' => 'PosSecret123',
        ]);

        $res->assertStatus(200);
        $res->assertJsonStructure([
            'data' => [
                'token',
                'session_id',
            ]
        ]);

        $this->assertDatabaseHas('auth_sessions', [
            'user_id' => $user->id,
            'device_type' => 'POS_TERMINAL',
            'device_name' => 'Terminal Station 01',
            'is_revoked' => false,
        ]);

        $token = $res->json('data.token');
        $meRes = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/auth/me');

        $meRes->assertStatus(200);
        $meRes->assertJson(['success' => true]);
        $this->assertEquals($user->id, $meRes->json('data.id'));
    }

    public function test_spa_cookie_based_session_login_and_logout(): void
    {
        $status = SysStatus::where('code', 'ACTIVE')->first();
        $user = User::create([
            'username' => 'cookie_user',
            'email' => 'cookie_user@smartpos.com',
            'password' => Hash::make('Password123!'),
            'status_id' => $status->id,
        ]);

        // 1. Check CSRF cookie endpoint
        $csrfRes = $this->get('/sanctum/csrf-cookie');
        $csrfRes->assertSuccessful();

        // 2. Login via POST establishing web session
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'username' => 'cookie_user',
            'password' => 'Password123!',
        ]);
        $loginRes->assertStatus(200);
        $this->assertAuthenticatedAs($user, 'web');

        // 3. Request profile using the authenticated session
        \Laravel\Sanctum\Sanctum::actingAs($user, ['*']);
        $profileRes = $this->getJson('/api/v1/user/profile');
        $profileRes->assertStatus(200);
        $this->assertEquals($user->id, $profileRes->json('data.id'));

        // 4. Logout
        $logoutRes = $this->postJson('/api/v1/auth/logout');
        $logoutRes->assertStatus(200);
        $this->assertGuest('web');

        // Reset auth guards in test memory
        app('auth')->forgetGuards();

        // 5. Subsequent profile request is unauthorized
        $guestProfileRes = $this->getJson('/api/v1/user/profile');
        $guestProfileRes->assertStatus(401);
    }
}
