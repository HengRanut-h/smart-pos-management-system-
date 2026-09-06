<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Return\Http\Controllers\ReturnController;

Route::prefix('returns')->group(function () {
    Route::get('/', [ReturnController::class, 'index']);
    Route::post('/', [ReturnController::class, 'store']);
    Route::post('/sales/{id}/void', [ReturnController::class, 'voidSale']);
});
