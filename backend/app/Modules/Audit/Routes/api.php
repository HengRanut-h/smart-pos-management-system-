<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Audit\Http\Controllers\AuditController;
use App\Modules\Audit\Http\Controllers\LoginAuditController;

Route::prefix('audit-logs')->group(function () {
    Route::get('/', [AuditController::class, 'index']);

    // User Login Audits & Session Management
    Route::prefix('login')->group(function () {
        Route::get('/', [LoginAuditController::class, 'index']);
        Route::get('/stats', [LoginAuditController::class, 'stats']);
        Route::get('/active-sessions', [LoginAuditController::class, 'activeSessions']);
        Route::post('/force-logout/{id}', [LoginAuditController::class, 'forceLogout']);
        Route::get('/export', [LoginAuditController::class, 'export']);
    });
});
