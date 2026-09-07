<?php

use Illuminate\Support\Facades\Route;
use App\Modules\User\Http\Controllers\UserProfileController;
use App\Modules\User\Http\Controllers\AdminUserManagementController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user/profile', [UserProfileController::class, 'getProfile']);
    Route::put('/user/profile', [UserProfileController::class, 'updateProfile']);
    Route::post('/user/profile', [UserProfileController::class, 'updateProfile']);

    // Admin Role & User Management
    Route::get('/admin/users', [AdminUserManagementController::class, 'index']);
    Route::get('/admin/branches', [AdminUserManagementController::class, 'branches']);
    Route::post('/admin/users/{id}/role', [AdminUserManagementController::class, 'assignRole']);
});
