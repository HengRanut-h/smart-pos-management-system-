<?php

namespace App\Modules\Authentication\Application\Actions;

use App\Modules\Authentication\Application\DTOs\OtpDTO;
use App\Modules\Authentication\Application\Services\OtpService;
use App\Modules\Authentication\Infrastructure\Repositories\UserRepository;

class VerifyOtpAction
{
    public function __construct(
        protected OtpService $otpService,
        protected UserRepository $userRepository
    ) {}

    public function execute(OtpDTO $dto): array
    {
        $result = $this->otpService->verify(
            $dto->destination,
            $dto->purpose,
            $dto->otp
        );

        if (!$result['success']) {
            return $result;
        }

        // If this was registration, activate the user account
        if ($dto->purpose === 'REGISTRATION') {
            $user = null;
            if ($result['user_id'] ?? null) {
                $user = $this->userRepository->findById($result['user_id']);
            }
            if (!$user) {
                $user = $this->userRepository->findByIdentifier($dto->destination);
            }

            if ($user) {
                $this->userRepository->activateUser($user);
                $result['user'] = $user->fresh();
            }
        }

        // If this was phone login, issue real session token and user profile
        if ($dto->purpose === 'PHONE_LOGIN') {
            $user = null;
            if ($result['user_id'] ?? null) {
                $user = $this->userRepository->findById($result['user_id']);
            }
            if (!$user) {
                $user = $this->userRepository->findByIdentifier($dto->destination);
            }

            if ($user) {
                $session = app(\App\Modules\Authentication\Application\Services\AuthService::class)->createSession($user, [
                    'device_type' => 'WEB',
                    'device_name' => 'Phone OTP Login',
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]);
                $result['token'] = $session['token'];
                $result['session_id'] = $session['session']->id ?? null;
                $result['user'] = $user->load('employee', 'roles.permissions', 'socialAccounts');
            } else {
                return [
                    'success' => false,
                    'message' => 'No matching active user found for this phone number.',
                ];
            }
        }

        return $result;
    }
}
