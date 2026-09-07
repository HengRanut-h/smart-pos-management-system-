<?php

namespace App\Modules\Authentication\Application\Actions;

use App\Modules\Authentication\Application\DTOs\RegisterDTO;
use App\Modules\Authentication\Application\Services\OtpService;
use App\Modules\Authentication\Infrastructure\Repositories\UserRepository;
use App\Modules\Employee\Persistence\Models\Employee;
use App\Modules\Settings\Persistence\Models\SysStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RegisterAction
{
    public function __construct(
        protected UserRepository $userRepository,
        protected OtpService $otpService
    ) {}

    public function execute(RegisterDTO $dto): array
    {
        return DB::transaction(function () use ($dto) {
            // Find PENDING_VERIFICATION status
            $pendingStatus = SysStatus::where('table_name', 'users')
                ->where('code', 'PENDING_VERIFICATION')
                ->first();

            $statusId = $pendingStatus ? $pendingStatus->id : 1;

            // Optional Employee creation for profile name
            $employee = null;
            if ($dto->name) {
                $names = explode(' ', $dto->name, 2);
                $employee = Employee::create([
                    'first_name' => $names[0] ?? $dto->name,
                    'last_name' => $names[1] ?? '',
                    'email' => $dto->email,
                    'phone' => $dto->phone,
                    'status_id' => $statusId,
                ]);
            }

            // Create User
            $user = $this->userRepository->create([
                'username' => $dto->username,
                'email' => $dto->email,
                'phone' => $dto->phone,
                'password' => Hash::make($dto->password),
                'employee_id' => $employee?->id,
                'status_id' => $statusId,
            ]);

            // Assign default 'Cashier' or lowest role if exists
            $defaultRole = \App\Modules\Role\Persistence\Models\Role::where('code', 'cashier')->first();
            if ($defaultRole) {
                $user->roles()->attach($defaultRole->id);
            }

            // Dispatch OTP code
            $destination = $dto->email;
            $channel = 'EMAIL';
            $otpResult = $this->otpService->generateAndSend($destination, 'REGISTRATION', $channel, $user->id);

            return [
                'user' => $user->load('employee', 'roles.permissions'),
                'otp' => $otpResult,
            ];
        });
    }
}
