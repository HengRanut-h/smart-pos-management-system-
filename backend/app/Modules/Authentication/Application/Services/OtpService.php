<?php

namespace App\Modules\Authentication\Application\Services;

use App\Modules\Authentication\Infrastructure\Repositories\OtpRepository;
use App\Modules\Authentication\Persistence\Models\OtpVerification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class OtpService
{
    public const OTP_EXPIRY_MINUTES = 5;
    public const COOLDOWN_SECONDS = 60;
    public const MAX_ATTEMPTS = 5;
    public const MAX_RESENDS = 3;

    public function __construct(
        protected OtpRepository $otpRepository,
        protected EmailOtpService $emailOtpService,
        protected SmsOtpService $smsOtpService
    ) {}

    public function generateAndSend(string $destination, string $purpose, string $channel = 'EMAIL', ?int $userId = null): array
    {
        $existing = $this->otpRepository->findLatestActive($destination, $purpose);

        if ($existing) {
            // Check cooldown
            if ($existing->cooldown_until && $existing->cooldown_until->isFuture()) {
                $wait = $existing->cooldown_until->diffInSeconds(now());
                return [
                    'success' => false,
                    'message' => "Please wait {$wait} seconds before requesting a new code.",
                    'cooldown_seconds' => $wait,
                ];
            }

            // Check max resends
            if ($existing->resend_count >= self::MAX_RESENDS) {
                return [
                    'success' => false,
                    'message' => 'Maximum resend limit reached. Please try again later.',
                ];
            }
        }

        // Generate 6-digit secure numeric OTP
        $otp = sprintf('%06d', random_int(100000, 999999));
        $otpHash = Hash::make($otp);

        $record = $this->otpRepository->create([
            'user_id' => $userId,
            'purpose' => $purpose,
            'channel' => strtoupper($channel),
            'destination' => $destination,
            'otp_hash' => $otpHash,
            'expires_at' => now()->addMinutes(self::OTP_EXPIRY_MINUTES),
            'attempts' => 0,
            'resend_count' => $existing ? ($existing->resend_count + 1) : 0,
            'cooldown_until' => now()->addSeconds(self::COOLDOWN_SECONDS),
        ]);

        // Dispatch via chosen channel
        if (strtoupper($channel) === 'SMS') {
            $this->smsOtpService->send($destination, $otp, $purpose);
        } else {
            $this->emailOtpService->send($destination, $otp, $purpose);
        }

        return [
            'success' => true,
            'message' => "Verification code sent to {$destination}",
            'destination' => $destination,
            'purpose' => $purpose,
            'channel' => $channel,
            'expires_in' => self::OTP_EXPIRY_MINUTES * 60,
            'cooldown_seconds' => self::COOLDOWN_SECONDS,
            // Only expose dev_otp/otp_code during automated PHPUnit test runs
            'dev_otp' => app()->environment('testing') ? $otp : null,
            'otp_code' => app()->environment('testing') ? $otp : null,
        ];
    }

    public function verify(string $destination, string $purpose, string $otp): array
    {
        $record = $this->otpRepository->findLatestActive($destination, $purpose);

        if (!$record) {
            return [
                'success' => false,
                'message' => 'No active OTP verification found. Please request a new code.',
            ];
        }

        if ($record->expires_at->isPast()) {
            return [
                'success' => false,
                'message' => 'This verification code has expired. Please request a new one.',
            ];
        }

        if ($record->attempts >= self::MAX_ATTEMPTS) {
            return [
                'success' => false,
                'message' => 'Too many failed attempts. This code is now invalid. Please request a new code.',
            ];
        }

        // Validate hash (supports both bcrypt and sha256)
        $hashMatches = (str_starts_with($record->otp_hash, '$2y$') && Hash::check($otp, $record->otp_hash))
            || ($record->otp_hash === hash('sha256', $otp));

        if (!$hashMatches) {
            $record->increment('attempts');
            $remaining = self::MAX_ATTEMPTS - $record->attempts;
            return [
                'success' => false,
                'message' => "Invalid code. {$remaining} attempts remaining.",
                'remaining_attempts' => $remaining,
            ];
        }

        // Mark verified
        $updateData = [
            'verified_at' => now(),
        ];

        $resetToken = null;
        if ($purpose === 'PASSWORD_RESET') {
            $resetToken = Str::random(64);
            $updateData['reset_token_hash'] = hash('sha256', $resetToken);
            $updateData['reset_token_expires_at'] = now()->addMinutes(15);
        }

        $record->update($updateData);

        return [
            'success' => true,
            'message' => 'Code verified successfully.',
            'reset_token' => $resetToken,
            'user_id' => $record->user_id,
            'record' => $record,
        ];
    }

    public function verifyResetToken(string $plainToken): ?OtpVerification
    {
        $tokenHash = hash('sha256', $plainToken);
        return $this->otpRepository->findValidResetToken($tokenHash);
    }
}
