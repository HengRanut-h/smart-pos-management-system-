<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Approval\Http\Controllers\ApprovalController;

Route::prefix('approvals')->group(function () {
    Route::get('/', [ApprovalController::class, 'index']);
    Route::get('/summary-metrics', [ApprovalController::class, 'summaryMetrics']);
    Route::get('/workflows', [ApprovalController::class, 'workflows']);
    Route::put('/workflows/{id}', [ApprovalController::class, 'updateWorkflow']);
    Route::get('/business-rules', [ApprovalController::class, 'businessRules']);
    Route::post('/business-rules', [ApprovalController::class, 'saveBusinessRule']);
    Route::put('/business-rules/{id}', [ApprovalController::class, 'saveBusinessRule']);
    Route::post('/business-rules/{id}/toggle', [ApprovalController::class, 'toggleBusinessRule']);
    Route::get('/{id}', [ApprovalController::class, 'show']);
    Route::post('/{id}/approve', [ApprovalController::class, 'approve']);
    Route::post('/{id}/reject', [ApprovalController::class, 'reject']);
    Route::post('/{id}/escalate', [ApprovalController::class, 'escalate']);
});

