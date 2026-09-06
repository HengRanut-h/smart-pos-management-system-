<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Backup\Http\Controllers\BackupController;

Route::prefix('backup')->group(function () {
    Route::get('/status', [BackupController::class, 'status']);
    Route::post('/create', [BackupController::class, 'create']);
    Route::get('/export/{type}', [BackupController::class, 'export']);
});
