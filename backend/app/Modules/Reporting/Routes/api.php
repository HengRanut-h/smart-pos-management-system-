<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Reporting\Http\Controllers\DashboardController;
use App\Modules\Reporting\Http\Controllers\ReportController;

Route::prefix('dashboard')->group(function () {
    Route::get('/metrics', [DashboardController::class, 'metrics']);
});

Route::prefix('reports')->group(function () {
    Route::get('/summary', [ReportController::class, 'summary']);
});
