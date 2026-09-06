<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Role\Http\Controllers\RoleController;

Route::prefix('roles')->group(function () {
    Route::get('/', [RoleController::class, 'index']);
    Route::get('/permissions', [RoleController::class, 'permissions']);
    Route::get('/{id}', [RoleController::class, 'show']);
    Route::post('/', [RoleController::class, 'store']);
    Route::put('/{id}', [RoleController::class, 'update']);
    Route::put('/{id}/permissions', [RoleController::class, 'syncPermissions']);
    Route::delete('/{id}', [RoleController::class, 'destroy']);
});
