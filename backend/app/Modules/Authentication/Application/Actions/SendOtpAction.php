<?php

namespace App\Modules\Authentication\Application\Actions;

use App\Modules\Authentication\Application\DTOs\OtpDTO;
use App\Modules\Authentication\Application\Services\OtpService;
use App\Modules\Authentication\Infrastructure\Repositories\UserRepository;

class SendOtpAction
{
    public function __construct(
        protected OtpService $otpService,
        protected UserRepository $userRepository
    ) {}

    public function execute(OtpDTO $dto): array
    {
        $userId = $dto->userId;

        // If purpose is PASSWORD_RESET or PHONE_LOGIN, verify account exists
        if (in_array($dto->purpose, ['PASSWORD_RESET', 'PHONE_LOGIN'])) {
            $user = $this->userRepository->findByIdentifier($dto->destination);
            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'No registered account found with that email or phone number.',
                ];
            }
            $userId = $user->id;
        }

        return $this->otpService->generateAndSend(
            $dto->destination,
            $dto->purpose,
            $dto->channel,
            $userId
        );
    }
}
