<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Unit\Http\Controllers\UnitController;

Route::prefix('units')->group(function () {
    Route::get('/', [UnitController::class, 'index']);
});
