<?php

namespace App\Modules\Authentication\Application\Services;

use App\Modules\Authentication\Application\DTOs\LoginDTO;
use App\Modules\Authentication\Infrastructure\Repositories\AuthSessionRepository;
use App\Modules\Authentication\Infrastructure\Repositories\UserRepository;
use App\Modules\User\Persistence\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthService
{
    public function __construct(
        protected UserRepository $userRepository,
        protected AuthSessionRepository $authSessionRepository
    ) {}

    public function authenticate(LoginDTO $dto): ?User
    {
        $user = $this->userRepository->findByIdentifier($dto->username);

        if (!$user || !Hash::check($dto->password, $user->password)) {
            return null;
        }

        // Update login statistics
        $this->userRepository->update($user, [
            'last_login_at' => now(),
            'last_login_ip' => $dto->ipAddress,
        ]);

        return $user;
    }

    public function createSession(User $user, array $deviceInfo = []): array
    {
        $plainToken = Str::random(80);
        $tokenHash = hash('sha256', $plainToken);

        $session = $this->authSessionRepository->createSession($user->id, $tokenHash, [
            'device_type' => $deviceInfo['device_type'] ?? 'WEB',
            'device_name' => $deviceInfo['device_name'] ?? null,
            'ip_address' => $deviceInfo['ip_address'] ?? request()->ip(),
            'user_agent' => $deviceInfo['user_agent'] ?? request()->userAgent(),
            'expires_at' => now()->addDays(30),
        ]);

        return [
            'token' => $plainToken,
            'session' => $session,
        ];
    }

    public function revokeSession(?string $plainToken): bool
    {
        if (!$plainToken) {
            return false;
        }

        $tokenHash = hash('sha256', $plainToken);
        return $this->authSessionRepository->revokeSession($tokenHash);
    }

    public function revokeAllSessions(int $userId): int
    {
        return $this->authSessionRepository->revokeAllForUser($userId);
    }
}
