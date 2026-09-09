<?php

use Illuminate\Support\Facades\Route;
use App\Modules\StaffBadge\Http\Controllers\StaffBadgeController;

Route::prefix('badges')->group(function () {
    // Templates
    Route::get('/templates', [StaffBadgeController::class, 'templates']);
    Route::post('/templates', [StaffBadgeController::class, 'saveTemplate']);
    Route::put('/templates/{id}', [StaffBadgeController::class, 'saveTemplate']);
    Route::delete('/templates/{id}', [StaffBadgeController::class, 'deleteTemplate']);
    Route::get('/templates/{id}/versions', [StaffBadgeController::class, 'templateVersions']);
    Route::post('/templates/{id}/restore/{versionId}', [StaffBadgeController::class, 'restoreTemplateVersion']);

    // Badges & Cards
    Route::get('/cards', [StaffBadgeController::class, 'badges']);
    Route::post('/cards/generate', [StaffBadgeController::class, 'issueBadge']);
    Route::post('/cards/{id}/status', [StaffBadgeController::class, 'updateStatus']);
    Route::post('/cards/{id}/replace', [StaffBadgeController::class, 'replaceBadge']);
    Route::post('/cards/{id}/nfc', [StaffBadgeController::class, 'bindNfc']);

    // Verification & Scanning
    Route::post('/verify-scan', [StaffBadgeController::class, 'verifyScan']);

    // Dashboard Metrics
    Route::get('/metrics', [StaffBadgeController::class, 'metrics']);
});
