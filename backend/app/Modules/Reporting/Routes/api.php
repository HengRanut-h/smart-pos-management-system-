<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Reporting\Http\Controllers\DashboardController;

Route::prefix('dashboard')->group(function () {
    Route::get('/metrics', [DashboardController::class, 'metrics']);
});
