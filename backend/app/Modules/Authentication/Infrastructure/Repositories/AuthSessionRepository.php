<?php

namespace App\Modules\Authentication\Infrastructure\Repositories;

use App\Modules\Authentication\Persistence\Models\AuthSession;
use Illuminate\Support\Collection;

class AuthSessionRepository
{
    public function findByTokenHash(string $tokenHash): ?AuthSession
    {
        return AuthSession::with('user')
            ->where('token_hash', $tokenHash)
            ->first();
    }

    public function createSession(int $userId, string $tokenHash, array $metadata = []): AuthSession
    {
        return AuthSession::create([
            'user_id' => $userId,
            'token_hash' => $tokenHash,
            'device_type' => $metadata['device_type'] ?? 'WEB',
            'device_name' => $metadata['device_name'] ?? null,
            'ip_address' => $metadata['ip_address'] ?? null,
            'user_agent' => $metadata['user_agent'] ?? null,
            'last_activity_at' => now(),
            'is_revoked' => false,
            'expires_at' => $metadata['expires_at'] ?? now()->addDays(30),
        ]);
    }

    public function revokeSession(string $tokenHash): bool
    {
        return (bool) AuthSession::where('token_hash', $tokenHash)
            ->update(['is_revoked' => true]);
    }

    public function revokeAllForUser(int $userId): int
    {
        return AuthSession::where('user_id', $userId)
            ->where('is_revoked', false)
            ->update(['is_revoked' => true]);
    }

    public function getActiveSessionsForUser(int $userId): Collection
    {
        return AuthSession::where('user_id', $userId)
            ->where('is_revoked', false)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->orderBy('last_activity_at', 'desc')
            ->get();
    }

    public function updateActivity(string $tokenHash): bool
    {
        return (bool) AuthSession::where('token_hash', $tokenHash)
            ->update(['last_activity_at' => now()]);
    }
}
