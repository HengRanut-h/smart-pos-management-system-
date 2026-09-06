<?php

namespace App\Modules\Authentication\Application\Actions;

use App\Modules\Authentication\Application\DTOs\LoginDTO;
use App\Modules\User\Persistence\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginAction
{
    public function execute(LoginDTO $dto): array
    {
        $user = User::where('username', $dto->username)
                    ->orWhere('email', $dto->username)
                    ->first();

        if (! $user || ! Hash::check($dto->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => [__('auth.failed')],
            ]);
        }

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $dto->ipAddress,
        ]);

        return [
            'user' => $user->load('employee', 'roles.permissions'),
            'token' => bin2hex(random_bytes(32)), // Placeholder or Sanctum token
        ];
    }
}
