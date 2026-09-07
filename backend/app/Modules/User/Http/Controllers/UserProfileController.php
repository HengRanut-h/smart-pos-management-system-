<?php

namespace App\Modules\User\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use App\Modules\User\Persistence\Models\User;
use App\Modules\Employee\Persistence\Models\Employee;
use App\Modules\POS\Persistence\Models\Shift;
use App\Modules\Sales\Persistence\Models\Sale;

class UserProfileController extends Controller
{
    /**
     * Get current user profile with employee details, branch, roles, and shift statistics.
     */
    public function getProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Load relations
        $user->loadMissing(['employee.branch', 'customer', 'roles.permissions']);

        // Shift statistics for current user
        $activeShift = Shift::where('cashier_id', $user->id)
            ->where('status', 'OPEN')
            ->latest('opened_at')
            ->first();

        $todaySalesCount = Sale::where('cashier_id', $user->id)
            ->whereDate('sale_date', today())
            ->count();

        $todaySalesTotal = Sale::where('cashier_id', $user->id)
            ->whereDate('sale_date', today())
            ->sum('total_amount');

        $employee = $user->employee;
        $customer = $user->customer;
        $branch = $employee?->branch;

        $firstName = $employee?->first_name
            ?? ($customer ? explode(' ', $customer->name)[0] : $user->username);
        $lastName = $employee?->last_name
            ?? ($customer && str_contains($customer->name, ' ') ? substr($customer->name, strpos($customer->name, ' ') + 1) : '');
        $fullName = $employee ? trim("{$employee->first_name} {$employee->last_name}")
            : ($customer?->name ?? $user->username);

        $roles = $user->roles->map(fn($r) => [
            'id' => $r->id,
            'name' => $r->name,
            'code' => $r->code,
        ]);

        if ($roles->isEmpty()) {
            $defaultRole = \App\Modules\Role\Persistence\Models\Role::where('code', 'CUSTOMER')->first();
            if ($defaultRole) {
                $roles = collect([[
                    'id' => $defaultRole->id,
                    'name' => $defaultRole->name,
                    'code' => $defaultRole->code,
                ]]);
            }
        }

        $permissions = $user->roles->flatMap(fn($r) => $r->permissions)->pluck('code')->unique()->values();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'phone' => $user->phone,
                'registration_source' => $user->registration_source ?? 'system',
                'first_name' => $firstName,
                'last_name' => $lastName,
                'full_name' => $fullName,
                'employee_code' => $employee?->employee_code,
                'customer_code' => $customer?->customer_code,
                'branch' => $branch ? [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'code' => $branch->code,
                    'address' => $branch->address,
                ] : null,
                'roles' => $roles,
                'primary_role' => $roles->first()['name'] ?? 'Customer',
                'permissions' => $permissions,
                'status' => 'ACTIVE',
                'last_login_at' => $user->last_login_at ?? now()->toIso8601String(),
                'last_login_ip' => $user->last_login_ip ?? '127.0.0.1',
                'stats' => [
                    'active_shift' => $activeShift ? [
                        'id' => $activeShift->id,
                        'opened_at' => $activeShift->opened_at,
                        'opening_cash' => (float) $activeShift->opening_cash,
                    ] : null,
                    'today_sales_count' => $todaySalesCount,
                    'today_sales_total' => (float) $todaySalesTotal,
                ],
            ]
        ]);
    }

    /**
     * Update user profile information.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $validated = $request->validate([
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:30',
            'current_password' => 'nullable|string',
            'new_password' => 'nullable|string|min:6',
        ]);

        // If changing password, verify current password
        if (!empty($validated['new_password'])) {
            if (empty($validated['current_password'])) {
                return response()->json([
                    'message' => 'Current password is required to set a new password.'
                ], 422);
            }

            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'message' => 'Current password does not match our records.'
                ], 422);
            }

            $user->password = Hash::make($validated['new_password']);
        }

        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }

        if (isset($validated['phone'])) {
            $user->phone = $validated['phone'];
        }

        $user->save();

        // Update employee if exists
        if ($user->employee && (isset($validated['first_name']) || isset($validated['last_name']))) {
            $employee = $user->employee;
            if (isset($validated['first_name'])) $employee->first_name = $validated['first_name'];
            if (isset($validated['last_name'])) $employee->last_name = $validated['last_name'];
            $employee->save();
        }

        // Update customer if exists
        if ($user->customer && (isset($validated['first_name']) || isset($validated['last_name']))) {
            $customer = $user->customer;
            $first = $validated['first_name'] ?? ($customer->name ? explode(' ', $customer->name)[0] : '');
            $last = $validated['last_name'] ?? ($customer->name && str_contains($customer->name, ' ') ? substr($customer->name, strpos($customer->name, ' ') + 1) : '');
            $customer->name = trim("{$first} {$last}");
            if (isset($validated['email'])) $customer->email = $validated['email'];
            if (isset($validated['phone'])) $customer->phone = $validated['phone'];
            $customer->save();
        }

        return $this->getProfile($request);
    }
}
