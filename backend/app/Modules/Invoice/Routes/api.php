<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Invoice\Http\Controllers\InvoiceController;

Route::prefix('invoices')->group(function () {
    Route::get('/', [InvoiceController::class, 'index']);
    Route::get('/{id}', [InvoiceController::class, 'show']);
    Route::post('/generate-from-sale/{saleId}', [InvoiceController::class, 'generateFromSale']);
});
