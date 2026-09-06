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
