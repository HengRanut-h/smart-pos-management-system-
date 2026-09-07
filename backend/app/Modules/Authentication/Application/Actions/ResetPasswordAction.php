<?php

namespace App\Modules\Authentication\Application\Actions;

use App\Modules\Authentication\Application\Services\OtpService;
use App\Modules\Authentication\Infrastructure\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ResetPasswordAction
{
    public function __construct(
        protected OtpService $otpService,
        protected UserRepository $userRepository
    ) {}

    public function execute(string $resetToken, string $newPassword): array
    {
        $verification = $this->otpService->verifyResetToken($resetToken);

        if (!$verification || !$verification->user) {
            throw ValidationException::withMessages([
                'reset_token' => ['Invalid or expired reset token. Please request a new code.'],
            ]);
        }

        $user = $verification->user;

        $this->userRepository->update($user, [
            'password' => Hash::make($newPassword),
        ]);

        // Invalidate the reset token
        $verification->update([
            'reset_token_expires_at' => now(),
        ]);

        return [
            'success' => true,
            'message' => 'Password has been reset successfully. You may now login.',
        ];
    }
}
