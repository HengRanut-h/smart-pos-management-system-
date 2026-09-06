<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Supplier\Http\Controllers\SupplierController;

Route::prefix('suppliers')->group(function () {
    Route::get('/', [SupplierController::class, 'index']);
    Route::post('/', [SupplierController::class, 'store']);
    Route::get('/{id}', [SupplierController::class, 'show']);
});
