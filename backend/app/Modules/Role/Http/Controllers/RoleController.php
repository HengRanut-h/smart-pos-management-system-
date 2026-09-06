<?php

namespace App\Modules\Role\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Role\Persistence\Models\Role;
use App\Modules\Permission\Persistence\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RoleController extends Controller
{
    /**
     * Display a listing of all roles with their assigned permissions.
     */
    public function index(): JsonResponse
    {
        $roles = Role::with('permissions')->get();

        return response()->json([
            'success' => true,
            'data' => $roles,
        ]);
    }

    /**
     * Get all system permissions grouped by module.
     */
    public function permissions(): JsonResponse
    {
        $permissions = Permission::all();
        $grouped = $permissions->groupBy('module');

        return response()->json([
            'success' => true,
            'data' => $permissions,
            'grouped' => $grouped,
        ]);
    }

    /**
     * Display the specified role.
     */
    public function show(int $id): JsonResponse
    {
        $role = Role::with('permissions')->find($id);

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Role not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $role,
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:roles,name',
            'code' => 'nullable|string|max:50|unique:roles,code',
            'description' => 'nullable|string',
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);

        $role = DB::transaction(function () use ($validated) {
            $code = !empty($validated['code']) 
                ? Str::upper(Str::slug($validated['code'], '_')) 
                : Str::upper(Str::slug($validated['name'], '_'));

            $newRole = Role::create([
                'name' => $validated['name'],
                'code' => $code,
                'description' => $validated['description'] ?? null,
                'status_id' => 1, // ACTIVE
            ]);

            if (!empty($validated['permission_ids'])) {
                $newRole->permissions()->sync($validated['permission_ids']);
            }

            return $newRole->load('permissions');
        });

        return response()->json([
            'success' => true,
            'message' => 'Role created successfully',
            'data' => $role,
        ], 201);
    }

    /**
     * Update the specified role and sync permissions.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100|unique:roles,name,' . $id,
            'code' => 'sometimes|nullable|string|max:50|unique:roles,code,' . $id,
            'description' => 'sometimes|nullable|string',
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);

        DB::transaction(function () use ($role, $validated, $request) {
            $updateData = collect($validated)->only(['name', 'code', 'description'])->toArray();
            if (isset($updateData['code']) && !empty($updateData['code'])) {
                $updateData['code'] = Str::upper(Str::slug($updateData['code'], '_'));
            }
            $role->update($updateData);

            if ($request->has('permission_ids')) {
                $role->permissions()->sync($validated['permission_ids'] ?? []);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully',
            'data' => $role->fresh('permissions'),
        ]);
    }

    /**
     * Sync permissions assigned to a role.
     */
    public function syncPermissions(Request $request, int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'permission_ids' => 'present|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);

        $role->permissions()->sync($validated['permission_ids']);

        return response()->json([
            'success' => true,
            'message' => 'Role permissions updated successfully',
            'data' => $role->fresh('permissions'),
        ]);
    }

    /**
     * Remove the specified role.
     */
    public function destroy(int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        if (in_array(strtoupper($role->code), ['SUPER_ADMIN', 'ADMIN', 'CASHIER'])) {
            return response()->json([
                'success' => false,
                'message' => 'System protected roles cannot be deleted',
            ], 422);
        }

        $role->delete();

        return response()->json([
            'success' => true,
            'message' => 'Role deleted successfully',
        ]);
    }
}
