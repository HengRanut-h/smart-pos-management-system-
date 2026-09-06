<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Sales\Http\Controllers\SaleController;

Route::prefix('sales')->group(function () {
    Route::get('/', [SaleController::class, 'index']);
    Route::post('/', [SaleController::class, 'store']);
    Route::get('/{id}', [SaleController::class, 'show']);
});
