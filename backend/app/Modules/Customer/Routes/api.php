<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Customer\Http\Controllers\CustomerController;

Route::prefix('customers')->group(function () {
    Route::get('/', [CustomerController::class, 'index']);
    Route::post('/', [CustomerController::class, 'store']);
    Route::get('/{id}', [CustomerController::class, 'show']);
});
