<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Role\Http\Controllers\RoleController;

Route::prefix('roles')->group(function () {
    Route::get('/', [RoleController::class, 'index']);
});
