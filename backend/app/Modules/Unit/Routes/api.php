<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Unit\Http\Controllers\UnitController;

Route::prefix('units')->group(function () {
    Route::get('/', [UnitController::class, 'index']);
    Route::post('/', [UnitController::class, 'store']);
    Route::put('/{id}', [UnitController::class, 'update']);
    Route::delete('/{id}', [UnitController::class, 'destroy']);
});
