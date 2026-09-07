<?php

namespace App\Modules\Authentication\Infrastructure\Repositories;

use App\Modules\Authentication\Persistence\Models\SocialAccount;

class SocialAccountRepository
{
    public function findByProvider(string $provider, string $providerId): ?SocialAccount
    {
        return SocialAccount::with('user')
            ->where('provider', $provider)
            ->where('provider_id', $providerId)
            ->first();
    }

    public function findByUserAndProvider(int $userId, string $provider): ?SocialAccount
    {
        return SocialAccount::where('user_id', $userId)
            ->where('provider', $provider)
            ->first();
    }

    public function create(array $data): SocialAccount
    {
        return SocialAccount::create($data);
    }

    public function updateOrCreate(array $attributes, array $values): SocialAccount
    {
        return SocialAccount::updateOrCreate($attributes, $values);
    }

    public function delete(SocialAccount $socialAccount): bool
    {
        return $socialAccount->delete();
    }
}
