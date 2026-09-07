<?php

namespace App\Modules\Authentication\Application\DTOs;

readonly class OtpDTO
{
    public function __construct(
        public string $destination,
        public string $purpose,
        public string $channel = 'EMAIL',
        public ?string $otp = null,
        public ?int $userId = null
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            destination: $data['destination'] ?? $data['email'] ?? $data['phone'],
            purpose: strtoupper($data['purpose'] ?? 'REGISTRATION'),
            channel: strtoupper($data['channel'] ?? 'EMAIL'),
            otp: $data['otp'] ?? null,
            userId: isset($data['user_id']) ? (int) $data['user_id'] : null
        );
    }
}
