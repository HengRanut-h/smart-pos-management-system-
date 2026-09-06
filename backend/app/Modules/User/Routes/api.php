<?php

use Illuminate\Support\Facades\Route;
use App\Modules\User\Http\Controllers\UserProfileController;

Route::get('/user/profile', [UserProfileController::class, 'getProfile']);
Route::put('/user/profile', [UserProfileController::class, 'updateProfile']);
Route::post('/user/profile', [UserProfileController::class, 'updateProfile']);
