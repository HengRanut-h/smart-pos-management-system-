<?php

namespace App\Modules\Role\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Role\Persistence\Models\Role;
use Illuminate\Http\JsonResponse;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::all(['id', 'code', 'name', 'description']);

        return response()->json([
            'success' => true,
            'data' => $roles,
        ]);
    }
}
