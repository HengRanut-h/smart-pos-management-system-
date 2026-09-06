<?php

namespace App\Modules\Employee\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Employee\Persistence\Models\Employee;
use App\Modules\User\Persistence\Models\User;
use App\Modules\Role\Persistence\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Employee::with(['branch', 'user.roles'])->latest();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('employee_code', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        $employees = $query->paginate($request->integer('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => $employees,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_code' => 'required|string|max:50|unique:employees,employee_code',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:255',
            'gender' => 'nullable|string|max:20',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'address' => 'nullable|string',
            'hire_date' => 'nullable|date',
            'status_id' => 'nullable|integer|exists:sys_statuses,id',
            // User account options
            'create_user' => 'nullable|boolean',
            'username' => 'nullable|required_if:create_user,true|string|max:100|unique:users,username',
            'password' => 'nullable|required_if:create_user,true|string|min:6',
            'role_id' => 'nullable|integer|exists:roles,id',
        ]);

        $employee = DB::transaction(function () use ($validated, $request) {
            $statusId = $validated['status_id'] ?? 1;

            $emp = Employee::create([
                'employee_code' => $validated['employee_code'],
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'phone' => $validated['phone'] ?? null,
                'email' => $validated['email'] ?? null,
                'gender' => $validated['gender'] ?? null,
                'branch_id' => $validated['branch_id'] ?? 1,
                'address' => $validated['address'] ?? null,
                'hire_date' => $validated['hire_date'] ?? now()->toDateString(),
                'status_id' => $statusId,
            ]);

            if ($request->boolean('create_user') && !empty($validated['username'])) {
                $user = User::create([
                    'username' => $validated['username'],
                    'email' => $validated['email'] ?? "{$validated['username']}@smartpos.local",
                    'phone' => $validated['phone'] ?? null,
                    'password' => Hash::make($validated['password']),
                    'employee_id' => $emp->id,
                    'status_id' => $statusId,
                ]);

                $roleId = $validated['role_id'] ?? 4; // default to Cashier (4)
                $user->roles()->sync([$roleId => ['assigned_by' => 1, 'assigned_at' => now()]]);
            }

            return $emp->load(['branch', 'user.roles']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Employee created successfully',
            'data' => $employee,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $employee = Employee::with(['branch', 'user.roles'])->find($id);

        if (! $employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $employee,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);

        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:100',
            'last_name' => 'sometimes|string|max:100',
            'phone' => 'sometimes|nullable|string|max:30',
            'email' => 'sometimes|nullable|email|max:255',
            'gender' => 'sometimes|nullable|string|max:20',
            'branch_id' => 'sometimes|integer|exists:branches,id',
            'address' => 'sometimes|nullable|string',
            'hire_date' => 'sometimes|nullable|date',
            'status_id' => 'sometimes|integer|exists:sys_statuses,id',
            'role_id' => 'sometimes|nullable|integer|exists:roles,id',
            'password' => 'sometimes|nullable|string|min:6',
        ]);

        DB::transaction(function () use ($employee, $validated, $request) {
            $employee->update(collect($validated)->except(['role_id', 'password'])->toArray());

            if ($employee->user) {
                if ($request->filled('role_id')) {
                    $employee->user->roles()->sync([
                        $request->integer('role_id') => ['assigned_by' => 1, 'assigned_at' => now()]
                    ]);
                }
                if ($request->filled('password')) {
                    $employee->user->update(['password' => Hash::make($request->input('password'))]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Employee updated successfully',
            'data' => $employee->fresh(['branch', 'user.roles']),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);

        DB::transaction(function () use ($employee) {
            if ($employee->user) {
                $employee->user->delete();
            }
            $employee->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Employee deleted successfully',
        ]);
    }
}
