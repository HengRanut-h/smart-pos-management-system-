<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Barcode\Http\Controllers\BarcodeController;

Route::prefix('barcode')->group(function () {
    Route::post('/resolve', [BarcodeController::class, 'resolve']);
    Route::post('/generate', [BarcodeController::class, 'generate']);
    Route::post('/assign', [BarcodeController::class, 'assign']);
});
