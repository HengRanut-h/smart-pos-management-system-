<?php

namespace App\Modules\Authentication\Application\DTOs;

readonly class LoginDTO
{
    public function __construct(
        public string $username,
        public string $password,
        public ?string $ipAddress = null
    ) {}
}
