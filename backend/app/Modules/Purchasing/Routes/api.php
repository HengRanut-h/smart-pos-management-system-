<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Purchasing\Http\Controllers\PurchaseController;

Route::prefix('purchases')->group(function () {
    Route::get('/', [PurchaseController::class, 'index']);
    Route::post('/', [PurchaseController::class, 'store']);
    Route::get('/{id}', [PurchaseController::class, 'show']);
    Route::post('/{id}/approve', [PurchaseController::class, 'approve']);
    Route::post('/{id}/receive', [PurchaseController::class, 'receive']);
});
