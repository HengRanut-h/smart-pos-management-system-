<?php

namespace App\Modules\User\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\User\Persistence\Models\User;
use App\Modules\Role\Persistence\Models\Role;
use App\Modules\Employee\Persistence\Models\Employee;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\Audit\Persistence\Models\AuditLog;
use App\Modules\Settings\Persistence\Models\SysStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminUserManagementController extends Controller
{
    /**
     * List system users with roles, employee, customer, and branch associations.
     */
    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only administrators can view system users.',
            ], 403);
        }

        $query = User::with(['roles.permissions', 'employee.branch', 'customer']);

        if ($request->filled('role')) {
            $roleCode = strtoupper($request->query('role'));
            $query->whereHas('roles', fn($q) => $q->where('code', $roleCode));
        }

        if ($request->filled('search')) {
            $search = '%' . trim($request->query('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('username', 'like', $search)
                  ->orWhere('email', 'like', $search)
                  ->orWhere('phone', 'like', $search);
            });
        }

        $users = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Assign or change a user's role and branch with strict privilege checks and audit logging.
     */
    public function assignRole(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();

        // 1. Authorization: Only authenticated Admins / Super Admins can manage roles
        if (!$currentUser || !$currentUser->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Only administrators can assign customers that register by yourself to other roles.',
            ], 403);
        }

        $validated = $request->validate([
            'role' => 'required|string',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'reason' => 'nullable|string|max:255',
        ]);

        $targetRoleCode = strtoupper(trim($validated['role']));
        $targetRole = Role::where('code', $targetRoleCode)->first();

        if (!$targetRole) {
            return response()->json([
                'success' => false,
                'message' => "Role [{$validated['role']}] does not exist in the system.",
            ], 422);
        }

        // 2. Privilege Hierarchy Check:
        // Only SUPER_ADMIN can assign or promote anyone to ADMIN or SUPER_ADMIN
        if (in_array($targetRoleCode, ['ADMIN', 'SUPER_ADMIN']) && !$currentUser->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Only Super Administrators can assign Admin or Super Admin roles.',
            ], 403);
        }

        $user = User::with(['roles', 'employee', 'customer'])->findOrFail($id);
        $oldRoles = $user->roles->pluck('code')->toArray();

        // 3. Branch / Employee Assignment:
        // If promoting to an internal staff role and user does not have an Employee profile yet
        $staffRoles = ['CASHIER', 'MANAGER', 'STOCK_MANAGER', 'ACCOUNTANT', 'HR', 'EMPLOYEE', 'PURCHASING_STAFF', 'DELIVERY_STAFF', 'SUPPORT_STAFF', 'ADMIN', 'SUPER_ADMIN'];
        $branchId = $validated['branch_id'] ?? Branch::value('id') ?? 1;

        if (in_array($targetRoleCode, $staffRoles)) {
            if (!$user->employee) {
                $activeStatusId = SysStatus::where('domain', 'USER')->where('code', 'ACTIVE')->value('id')
                    ?? SysStatus::where('domain', 'SYSTEM')->where('code', 'ACTIVE')->value('id') ?? 1;

                $firstName = $user->customer ? explode(' ', $user->customer->name)[0] : $user->username;
                $lastName = ($user->customer && str_contains($user->customer->name, ' '))
                    ? substr($user->customer->name, strpos($user->customer->name, ' ') + 1)
                    : 'Staff';

                $employee = Employee::create([
                    'employee_code' => 'EMP-' . strtoupper(Str::random(5)),
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'branch_id' => $branchId,
                    'status_id' => $activeStatusId,
                ]);

                $user->update(['employee_id' => $employee->id]);
            } elseif (!empty($validated['branch_id'])) {
                $user->employee->update(['branch_id' => $validated['branch_id']]);
            }
        }

        // 4. Update role assignment with assigned_by and assigned_at
        $user->roles()->sync([
            $targetRole->id => [
                'assigned_by' => $currentUser->id,
                'assigned_at' => now(),
            ],
        ]);

        // 5. Immutable Audit Log Entry
        AuditLog::create([
            'user_id' => $currentUser->id,
            'action' => 'ROLE_CHANGED',
            'entity_type' => 'USER',
            'entity_id' => $user->id,
            'old_values' => [
                'roles' => $oldRoles,
            ],
            'new_values' => [
                'roles' => [$targetRoleCode],
                'branch_id' => $branchId,
                'reason' => $validated['reason'] ?? 'Admin role assignment',
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Role successfully updated to {$targetRole->name}.",
            'data' => [
                'user' => $user->fresh(['roles.permissions', 'employee.branch', 'customer']),
                'previous_roles' => $oldRoles,
                'current_role' => $targetRoleCode,
                'branch_id' => $branchId,
            ],
        ]);
    }

    /**
     * List system branches for role assignment.
     */
    public function branches(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $branches = Branch::select('id', 'name', 'code', 'is_active')->get();
        return response()->json([
            'success' => true,
            'data' => $branches,
        ]);
    }
}
