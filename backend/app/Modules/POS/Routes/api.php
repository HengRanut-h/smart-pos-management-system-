<?php

use Illuminate\Support\Facades\Route;
use App\Modules\POS\Http\Controllers\ShiftController;

Route::prefix('pos')->group(function () {
    Route::get('/registers', [ShiftController::class, 'registers']);
    Route::get('/shifts/current', [ShiftController::class, 'currentShift']);
    Route::post('/shifts/open', [ShiftController::class, 'open']);
    Route::post('/shifts/movement', [ShiftController::class, 'movement']);
    Route::post('/shifts/close', [ShiftController::class, 'close']);
    Route::get('/shifts/history', [ShiftController::class, 'history']);
});
