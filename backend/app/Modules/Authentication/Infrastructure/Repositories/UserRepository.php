<?php

namespace App\Modules\Authentication\Infrastructure\Repositories;

use App\Modules\User\Persistence\Models\User;
use App\Modules\Settings\Persistence\Models\SysStatus;

class UserRepository
{
    public function findById(int $id): ?User
    {
        return User::with(['roles.permissions', 'employee', 'socialAccounts'])->find($id);
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function findByUsername(string $username): ?User
    {
        return User::where('username', $username)->first();
    }

    public function findByPhone(string $phone): ?User
    {
        return User::where('phone', $phone)->first();
    }

    public function findByIdentifier(string $identifier): ?User
    {
        return User::where('username', $identifier)
            ->orWhere('email', $identifier)
            ->orWhere('phone', $identifier)
            ->first();
    }

    public function create(array $data): User
    {
        return User::create($data);
    }

    public function update(User $user, array $data): bool
    {
        return $user->update($data);
    }

    public function activateUser(User $user): bool
    {
        $activeStatus = SysStatus::where('table_name', 'users')
            ->where('code', 'ACTIVE')
            ->first();

        $statusId = $activeStatus ? $activeStatus->id : ($user->status_id ?: 1);

        return $user->update([
            'status_id' => $statusId,
            'email_verified_at' => $user->email_verified_at ?: now(),
        ]);
    }
}
