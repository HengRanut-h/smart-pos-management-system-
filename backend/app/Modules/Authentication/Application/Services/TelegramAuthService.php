<?php

namespace App\Modules\Authentication\Application\Services;

use App\Modules\Authentication\Infrastructure\Repositories\SocialAccountRepository;
use App\Modules\Authentication\Infrastructure\Repositories\UserRepository;
use App\Modules\User\Persistence\Models\User;
use App\Modules\Settings\Persistence\Models\SysStatus;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TelegramAuthService
{
    public function __construct(
        protected SocialAccountRepository $socialAccountRepository,
        protected UserRepository $userRepository
    ) {}

    public function verifyTelegramData(array $authData, string $botToken): bool
    {
        if (empty($authData['hash'])) {
            return false;
        }

        $checkHash = $authData['hash'];
        $data = $authData;
        unset($data['hash']);

        $dataCheckArr = [];
        foreach ($data as $key => $value) {
            $dataCheckArr[] = $key . '=' . $value;
        }
        sort($dataCheckArr);
        $dataCheckString = implode("\n", $dataCheckArr);

        $secretKey = hash('sha256', $botToken, true);
        $hash = hash_hmac('sha256', $dataCheckString, $secretKey);

        if (strcmp($hash, $checkHash) !== 0) {
            return false;
        }

        if (isset($authData['auth_date']) && (time() - $authData['auth_date'] > 86400)) {
            return false;
        }

        return true;
    }

    public function handleTelegramUser(array $telegramData): User
    {
        $providerId = (string) $telegramData['id'];
        $username = $telegramData['username'] ?? null;
        $firstName = $telegramData['first_name'] ?? '';
        $lastName = $telegramData['last_name'] ?? '';
        $name = trim("{$firstName} {$lastName}") ?: ($username ?: "telegram_{$providerId}");
        $avatar = $telegramData['photo_url'] ?? null;

        $socialAccount = $this->socialAccountRepository->findByProvider('telegram', $providerId);

        if ($socialAccount && $socialAccount->user) {
            $this->socialAccountRepository->updateOrCreate(
                ['provider' => 'telegram', 'provider_id' => $providerId],
                [
                    'nickname' => $name,
                    'avatar' => $avatar,
                    'raw_user_data' => $telegramData,
                ]
            );
            return $socialAccount->user;
        }

        // Create new user if not linked
        $activeStatusId = SysStatus::where('domain', 'USER')->where('code', 'ACTIVE')->value('id')
            ?? SysStatus::where('code', 'ACTIVE')->value('id')
            ?? 1;

        $customer = \App\Modules\Customer\Persistence\Models\Customer::create([
            'customer_code' => 'CUST-' . strtoupper(Str::random(6)),
            'name' => $name,
            'phone' => null,
            'status_id' => $activeStatusId,
            'loyalty_points' => 0,
        ]);

        $baseUsername = $username ?: ('tg_' . $providerId);
        $uniqueUsername = $baseUsername;
        $counter = 1;
        while ($this->userRepository->findByUsername($uniqueUsername)) {
            $uniqueUsername = $baseUsername . '_' . $counter++;
        }

        $user = $this->userRepository->create([
            'username' => $uniqueUsername,
            'password' => Hash::make(Str::random(24)),
            'customer_id' => $customer->id,
            'registration_source' => 'public',
            'status_id' => $activeStatusId,
        ]);

        $customerRole = \App\Modules\Role\Persistence\Models\Role::where('code', 'CUSTOMER')->first();
        if ($customerRole) {
            $user->roles()->syncWithoutDetaching([$customerRole->id]);
        }

        $this->socialAccountRepository->create([
            'user_id' => $user->id,
            'provider' => 'telegram',
            'provider_id' => $providerId,
            'nickname' => $name,
            'avatar' => $avatar,
            'raw_user_data' => $telegramData,
        ]);

        return $user;
    }
}
