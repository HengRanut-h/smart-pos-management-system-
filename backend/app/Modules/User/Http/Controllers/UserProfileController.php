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
        $user = $request->user() ?? User::with(['employee.branch', 'roles'])->first();

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // Load relations
        $user->loadMissing(['employee.branch', 'roles.permissions']);

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
        $branch = $employee?->branch;

        $roles = $user->roles->map(fn($r) => [
            'id' => $r->id,
            'name' => $r->name,
            'code' => $r->code,
        ]);

        $permissions = $user->roles->flatMap(fn($r) => $r->permissions)->pluck('code')->unique()->values();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'phone' => $user->phone,
                'first_name' => $employee?->first_name ?? 'Lead',
                'last_name' => $employee?->last_name ?? 'Admin',
                'full_name' => trim(($employee?->first_name ?? 'Lead') . ' ' . ($employee?->last_name ?? 'Admin')),
                'employee_code' => $employee?->employee_code ?? 'EMP-001',
                'branch' => [
                    'id' => $branch?->id ?? 1,
                    'name' => $branch?->name ?? 'Phnom Penh Headquarters',
                    'code' => $branch?->code ?? 'HQ-01',
                    'address' => $branch?->address ?? 'Preah Monivong Blvd, Phnom Penh',
                ],
                'roles' => $roles,
                'primary_role' => $roles->first()['name'] ?? 'Super Administrator',
                'permissions' => $permissions,
                'status' => 'ACTIVE',
                'last_login_at' => $user->last_login_at ?? now()->subHours(2)->toIso8601String(),
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
        $user = $request->user() ?? User::first();

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
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

        // Update employee first and last name if exists
        if ($user->employee && (isset($validated['first_name']) || isset($validated['last_name']))) {
            $employee = $user->employee;
            if (isset($validated['first_name'])) $employee->first_name = $validated['first_name'];
            if (isset($validated['last_name'])) $employee->last_name = $validated['last_name'];
            $employee->save();
        }

        return $this->getProfile($request);
    }
}
