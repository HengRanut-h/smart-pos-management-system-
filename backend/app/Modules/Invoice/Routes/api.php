<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Invoice\Http\Controllers\InvoiceController;
use App\Modules\Invoice\Http\Controllers\InvoiceTemplateController;

Route::prefix('invoices')->group(function () {
    Route::get('/', [InvoiceController::class, 'index']);
    Route::get('/{id}', [InvoiceController::class, 'show']);
    Route::post('/generate-from-sale/{saleId}', [InvoiceController::class, 'generateFromSale']);
});

Route::prefix('invoice-templates')->group(function () {
    Route::get('/', [InvoiceTemplateController::class, 'index']);
    Route::get('/assignments', [InvoiceTemplateController::class, 'getAssignments']);
    Route::post('/assignments', [InvoiceTemplateController::class, 'saveAssignments']);
    Route::get('/{id}', [InvoiceTemplateController::class, 'show']);
    Route::post('/', [InvoiceTemplateController::class, 'store']);
    Route::put('/{id}', [InvoiceTemplateController::class, 'update']);
    Route::post('/{id}/duplicate', [InvoiceTemplateController::class, 'duplicate']);
    Route::post('/{id}/set-default', [InvoiceTemplateController::class, 'setDefault']);
    Route::delete('/{id}', [InvoiceTemplateController::class, 'destroy']);
    Route::post('/{id}/restore-version/{versionId}', [InvoiceTemplateController::class, 'restoreVersion']);
});

Route::prefix('invoice-sequences')->group(function () {
    Route::get('/', [InvoiceTemplateController::class, 'getSequences']);
    Route::post('/', [InvoiceTemplateController::class, 'saveSequence']);
    Route::put('/{id}', [InvoiceTemplateController::class, 'saveSequence']);
    Route::post('/preview', [InvoiceTemplateController::class, 'previewSequence']);
});

