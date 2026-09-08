<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Settings\Http\Controllers\SettingsHubController;

Route::prefix('settings')->group(function () {
    // Legacy / Quick settings
    Route::get('/', [SettingsHubController::class, 'getSettings']);
    Route::post('/', [SettingsHubController::class, 'updateSettings']);
    Route::post('/upload-logo', [SettingsHubController::class, 'uploadLogo']);

    // Global & Company
    Route::get('/system', [SettingsHubController::class, 'getSystemSettings']);
    Route::post('/system', [SettingsHubController::class, 'updateSettings']);
    Route::get('/company', [SettingsHubController::class, 'getCompany']);
    Route::post('/company', [SettingsHubController::class, 'updateCompany']);

    // Branches CRUD & Overrides
    Route::get('/branches', [SettingsHubController::class, 'getBranches']);
    Route::post('/branches', [SettingsHubController::class, 'createBranch']);
    Route::get('/branches/{id}', [SettingsHubController::class, 'getBranchDetails']);
    Route::put('/branches/{id}', [SettingsHubController::class, 'updateBranch']);
    Route::delete('/branches/{id}', [SettingsHubController::class, 'deleteBranch']);
    Route::get('/branches/{id}/overrides', [SettingsHubController::class, 'getBranchOverrides']);
    Route::post('/branches/{id}/overrides', [SettingsHubController::class, 'saveBranchOverrides']);
    Route::get('/branches/{id}/merged', [SettingsHubController::class, 'getMergedSettings']);

    // POS Terminals
    Route::get('/branches/{id}/terminals', [SettingsHubController::class, 'getTerminals']);
    Route::post('/terminals', [SettingsHubController::class, 'saveTerminal']);
    Route::delete('/terminals/{id}', [SettingsHubController::class, 'deleteTerminal']);

    // Printers
    Route::get('/branches/{id}/printers', [SettingsHubController::class, 'getPrinters']);
    Route::post('/printers', [SettingsHubController::class, 'savePrinter']);
    Route::delete('/printers/{id}', [SettingsHubController::class, 'deletePrinter']);

    // Number Sequences
    Route::get('/branches/{id}/sequences', [SettingsHubController::class, 'getSequences']);
    Route::post('/sequences', [SettingsHubController::class, 'saveSequence']);

    // Business Hours & Holidays
    Route::get('/branches/{id}/hours', [SettingsHubController::class, 'getBusinessHours']);
    Route::post('/branches/{id}/hours', [SettingsHubController::class, 'saveBusinessHours']);
    Route::get('/holidays', [SettingsHubController::class, 'getHolidays']);
    Route::post('/holidays', [SettingsHubController::class, 'saveHoliday']);
    Route::delete('/holidays/{id}', [SettingsHubController::class, 'deleteHoliday']);

    // Branch Users
    Route::get('/branches/{id}/users', [SettingsHubController::class, 'getBranchUsers']);
    Route::post('/branch-users', [SettingsHubController::class, 'assignUser']);
    Route::delete('/branch-users/{id}', [SettingsHubController::class, 'removeUser']);

    // Notifications & Audits
    Route::get('/notifications', [SettingsHubController::class, 'getNotifications']);
    Route::post('/notifications', [SettingsHubController::class, 'saveNotifications']);
    Route::get('/audits', [SettingsHubController::class, 'getAudits']);
});
