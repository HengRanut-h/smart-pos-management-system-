<?php

namespace App\Modules\Authentication\Application\Actions;

use App\Modules\Authentication\Application\Services\AuthService;

class LogoutAction
{
    public function __construct(
        protected AuthService $authService
    ) {}

    public function execute(?string $bearerToken): bool
    {
        if (!$bearerToken) {
            return true;
        }

        return $this->authService->revokeSession($bearerToken);
    }
}
