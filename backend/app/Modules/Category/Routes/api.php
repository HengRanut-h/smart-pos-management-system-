<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Category\Http\Controllers\CategoryController;

Route::prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'index']);
});
