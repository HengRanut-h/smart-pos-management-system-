<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Inventory\Http\Controllers\InventoryController;

Route::prefix('inventory')->group(function () {
    Route::get('/stocks', [InventoryController::class, 'stocks']);
    Route::get('/movements', [InventoryController::class, 'movements']);
    Route::get('/alerts', [InventoryController::class, 'alerts']);
    Route::post('/adjust', [InventoryController::class, 'adjust']);
    Route::post('/transfer', [InventoryController::class, 'transfer']);
});
