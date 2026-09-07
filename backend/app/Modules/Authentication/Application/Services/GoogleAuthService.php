<?php

namespace App\Modules\Authentication\Application\Services;

use App\Modules\Authentication\Infrastructure\Repositories\SocialAccountRepository;
use App\Modules\Authentication\Infrastructure\Repositories\UserRepository;
use App\Modules\User\Persistence\Models\User;
use App\Modules\Employee\Persistence\Models\Employee;
use App\Modules\Role\Persistence\Models\Role;
use App\Modules\Settings\Persistence\Models\SysStatus;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class GoogleAuthService
{
    public function __construct(
        protected SocialAccountRepository $socialAccountRepository,
        protected UserRepository $userRepository
    ) {}

    public function handleGoogleUser(array $googleData): User
    {
        $providerId = (string) ($googleData['id'] ?? $googleData['sub']);
        $email = $googleData['email'] ?? null;
        $name = $googleData['name'] ?? trim(($googleData['given_name'] ?? '') . ' ' . ($googleData['family_name'] ?? ''));
        $avatar = $googleData['picture'] ?? ($googleData['avatar'] ?? null);
        $token = $googleData['token'] ?? null;
        $refreshToken = $googleData['refresh_token'] ?? null;

        // 1. Check if social account already exists
        $socialAccount = $this->socialAccountRepository->findByProvider('google', $providerId);

        if ($socialAccount && $socialAccount->user) {
            $this->socialAccountRepository->updateOrCreate(
                ['provider' => 'google', 'provider_id' => $providerId],
                [
                    'email' => $email,
                    'nickname' => $name,
                    'avatar' => $avatar,
                    'token' => $token ?? $socialAccount->token,
                    'refresh_token' => $refreshToken ?? $socialAccount->refresh_token,
                    'raw_user_data' => $googleData,
                ]
            );
            return $socialAccount->user;
        }

        // 2. Check if local user with this email already exists
        $user = $email ? $this->userRepository->findByEmail($email) : null;

        if (!$user) {
            // Find active status
            $activeStatusId = SysStatus::where('domain', 'USER')->where('code', 'ACTIVE')->value('id')
                ?? SysStatus::where('code', 'ACTIVE')->value('id')
                ?? 1;

            $givenName = $googleData['given_name'] ?? ($name ?: 'Google');
            $familyName = $googleData['family_name'] ?? 'User';
            $fullName = $name ?: trim("{$givenName} {$familyName}");

            // Create customer record for public Google registration
            $customer = \App\Modules\Customer\Persistence\Models\Customer::create([
                'customer_code' => 'CUST-' . strtoupper(Str::random(6)),
                'name' => $fullName,
                'email' => $email,
                'phone' => null,
                'status_id' => $activeStatusId,
                'loyalty_points' => 0,
            ]);

            // Create unique username
            $baseUsername = Str::slug($name ?: ($email ? explode('@', $email)[0] : 'google_user'), '_');
            $username = $baseUsername ?: 'google_user';
            $counter = 1;
            while ($this->userRepository->findByUsername($username)) {
                $username = $baseUsername . '_' . $counter++;
            }

            // Create local user linked to Customer with public source
            $user = $this->userRepository->create([
                'username' => $username,
                'email' => $email,
                'password' => Hash::make(Str::random(32)),
                'customer_id' => $customer->id,
                'employee_id' => null,
                'registration_source' => 'public',
                'status_id' => $activeStatusId,
                'email_verified_at' => now(),
            ]);

            // Assign default CUSTOMER role
            $customerRole = Role::where('code', 'CUSTOMER')->first();
            if ($customerRole) {
                $user->roles()->syncWithoutDetaching([$customerRole->id]);
            }
        }

        // 3. Link or update social account
        $this->socialAccountRepository->updateOrCreate(
            ['provider' => 'google', 'provider_id' => $providerId],
            [
                'user_id' => $user->id,
                'email' => $email,
                'nickname' => $name,
                'avatar' => $avatar,
                'token' => $token,
                'refresh_token' => $refreshToken,
                'raw_user_data' => $googleData,
            ]
        );

        return $user;
    }
}
