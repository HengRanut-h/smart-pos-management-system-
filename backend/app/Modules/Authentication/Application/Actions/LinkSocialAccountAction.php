<?php

namespace App\Modules\Authentication\Application\Actions;

use App\Modules\Authentication\Infrastructure\Repositories\SocialAccountRepository;
use App\Modules\Authentication\Persistence\Models\SocialAccount;
use App\Modules\User\Persistence\Models\User;

class LinkSocialAccountAction
{
    public function __construct(
        protected SocialAccountRepository $socialAccountRepository
    ) {}

    public function execute(User $user, string $provider, string $providerId, array $profileData = []): SocialAccount
    {
        return $this->socialAccountRepository->updateOrCreate(
            [
                'provider' => $provider,
                'provider_id' => $providerId,
            ],
            [
                'user_id' => $user->id,
                'email' => $profileData['email'] ?? null,
                'nickname' => $profileData['nickname'] ?? $profileData['name'] ?? null,
                'avatar' => $profileData['avatar'] ?? null,
                'raw_user_data' => $profileData,
            ]
        );
    }
}
