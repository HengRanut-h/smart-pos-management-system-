<?php

namespace App\Modules\Authentication\Infrastructure\Repositories;

use App\Modules\Authentication\Persistence\Models\OtpVerification;

class OtpRepository
{
    public function findLatestActive(string $destination, string $purpose): ?OtpVerification
    {
        return OtpVerification::where('destination', $destination)
            ->where('purpose', $purpose)
            ->whereNull('verified_at')
            ->orderBy('id', 'desc')
            ->first();
    }

    public function findValidResetToken(string $tokenHash): ?OtpVerification
    {
        return OtpVerification::where('reset_token_hash', $tokenHash)
            ->where('purpose', 'PASSWORD_RESET')
            ->whereNotNull('verified_at')
            ->where('reset_token_expires_at', '>', now())
            ->first();
    }

    public function create(array $data): OtpVerification
    {
        return OtpVerification::create($data);
    }

    public function update(OtpVerification $otp, array $data): bool
    {
        return $otp->update($data);
    }

    public function deleteExpired(): int
    {
        return OtpVerification::where('expires_at', '<', now()->subDays(7))->delete();
    }
}
