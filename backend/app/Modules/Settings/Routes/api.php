<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Settings\Http\Controllers\SettingsController;

Route::prefix('settings')->group(function () {
    Route::get('/', [SettingsController::class, 'getSettings']);
    Route::post('/', [SettingsController::class, 'updateSettings']);
    Route::post('/upload-logo', [SettingsController::class, 'uploadLogo']);
});
