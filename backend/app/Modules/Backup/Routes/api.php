<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Backup\Http\Controllers\BackupController;
use App\Modules\Backup\Http\Controllers\BackupHubController;

// Legacy routes (backwards compatibility)
Route::prefix('backup')->group(function () {
    Route::get('/status', [BackupController::class, 'status']);
    Route::post('/create', [BackupController::class, 'create']);
    Route::get('/export/{type}', [BackupController::class, 'export']);
});

// Comprehensive Backup & System Data Administration Hub
Route::prefix('backups')->group(function () {
    Route::get('/dashboard', [BackupHubController::class, 'dashboard']);
    Route::get('/records', [BackupHubController::class, 'records']);
    Route::post('/create', [BackupHubController::class, 'create']);
    // Telegram Bot & Alerts (defined before /{id} routes to avoid route collision)
    Route::prefix('telegram')->group(function () {
        Route::get('/settings', [BackupHubController::class, 'telegramSettings']);
        Route::post('/settings', [BackupHubController::class, 'saveTelegramSettings']);
        Route::post('/verify', [BackupHubController::class, 'verifyTelegramBotToken']);
        Route::post('/test-alert', [BackupHubController::class, 'telegramTestAlert']);
        Route::get('/logs', [BackupHubController::class, 'telegramLogs']);
    });

    Route::post('/{id}/verify', [BackupHubController::class, 'verify'])->where('id', '[0-9]+');
    Route::post('/{id}/restore', [BackupHubController::class, 'restore'])->where('id', '[0-9]+');
    Route::get('/{id}/download', [BackupHubController::class, 'download'])->where('id', '[0-9]+');
    Route::post('/{id}/send-telegram', [BackupHubController::class, 'sendToTelegram'])->where('id', '[0-9]+');
    Route::delete('/{id}', [BackupHubController::class, 'destroy'])->where('id', '[0-9]+');

    // Schedules & Retention
    Route::get('/schedules/all', [BackupHubController::class, 'schedules']);
    Route::post('/schedules/save', [BackupHubController::class, 'saveSchedule']);
    Route::post('/schedules/{id}/toggle', [BackupHubController::class, 'toggleScheduleStatus'])->where('id', '[0-9]+');
    Route::post('/schedules/{id}/run-now', [BackupHubController::class, 'runScheduleNow'])->where('id', '[0-9]+');
    Route::delete('/schedules/{id}', [BackupHubController::class, 'deleteSchedule'])->where('id', '[0-9]+');
    Route::post('/schedules/prune-expired', [BackupHubController::class, 'pruneExpired']);

    // System Data & Database Maintenance
    Route::get('/maintenance/stats', [BackupHubController::class, 'maintenanceStats']);
    Route::post('/maintenance/optimize', [BackupHubController::class, 'optimize']);

    // Import / Export
    Route::get('/export/{type}', [BackupHubController::class, 'exportData']);
    Route::post('/export/{type}/send-telegram', [BackupHubController::class, 'sendExportToTelegram']);
});

