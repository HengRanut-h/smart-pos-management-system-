<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Payment\Http\Controllers\PaymentController;

Route::prefix('payments')->group(function () {
    Route::get('/', [PaymentController::class, 'index']);
    Route::get('/{id}', [PaymentController::class, 'show']);
    Route::post('/khqr/generate', [PaymentController::class, 'generateKHQR']);
    Route::post('/{id}/verify', [PaymentController::class, 'verify']);
});
