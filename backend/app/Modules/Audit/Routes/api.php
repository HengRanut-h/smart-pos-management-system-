<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Audit\Http\Controllers\AuditController;

Route::prefix('audit-logs')->group(function () {
    Route::get('/', [AuditController::class, 'index']);
});
