<?php

namespace App\Modules\Authentication\Application\DTOs;

readonly class RegisterDTO
{
    public function __construct(
        public string $name,
        public string $username,
        public string $email,
        public ?string $phone,
        public string $password,
        public bool $acceptTerms = true,
        public ?string $ipAddress = null,
        public ?string $userAgent = null
    ) {}

    public static function fromArray(array $data, ?string $ipAddress = null, ?string $userAgent = null): self
    {
        return new self(
            name: $data['name'],
            username: $data['username'],
            email: $data['email'],
            phone: $data['phone'] ?? null,
            password: $data['password'],
            acceptTerms: (bool) ($data['accept_terms'] ?? true),
            ipAddress: $ipAddress,
            userAgent: $userAgent
        );
    }
}
