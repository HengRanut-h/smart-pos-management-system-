<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Product\Http\Controllers\ProductDashboardController;
use App\Modules\Product\Http\Controllers\ProductCatalogController;
use App\Modules\Product\Http\Controllers\ProductVariantController;
use App\Modules\Product\Http\Controllers\ProductPricingController;
use App\Modules\Product\Http\Controllers\ProductInventoryController;
use App\Modules\Product\Http\Controllers\ProductManufacturingController;
use App\Modules\Product\Http\Controllers\ProductQualityController;
use App\Modules\Product\Http\Controllers\ProductAnalyticsController;

Route::prefix('products')->group(function () {
    // 01. Dashboard
    Route::get('/dashboard', [ProductDashboardController::class, 'getDashboard']);

    // 02. Catalog CRUD & Batch Actions
    Route::get('/', [ProductCatalogController::class, 'index']);
    Route::post('/', [ProductCatalogController::class, 'store']);
    Route::get('/{id}', [ProductCatalogController::class, 'show'])->where('id', '[0-9]+');
    Route::put('/{id}', [ProductCatalogController::class, 'update'])->where('id', '[0-9]+');
    Route::delete('/{id}', [ProductCatalogController::class, 'destroy'])->where('id', '[0-9]+');
    Route::post('/{id}/duplicate', [ProductCatalogController::class, 'duplicate'])->where('id', '[0-9]+');

    // 04. Variants
    Route::get('/variants', [ProductVariantController::class, 'index']);
    Route::post('/variants', [ProductVariantController::class, 'store']);
    Route::post('/variants/matrix', [ProductVariantController::class, 'generateMatrix']);
    Route::delete('/variants/{id}', [ProductVariantController::class, 'destroy'])->where('id', '[0-9]+');

    // 08 & 09. Pricing & Landed Cost
    Route::get('/price-rules', [ProductPricingController::class, 'getPriceRules']);
    Route::post('/price-rules', [ProductPricingController::class, 'storePriceRule']);
    Route::post('/landed-cost/calculate', [ProductPricingController::class, 'calculateLandedCost']);

    // 10, 11, 12, 23, 25. Inventory, Warehouse Bins, Batches, Serials, Conversions
    Route::get('/warehouse-locations', [ProductInventoryController::class, 'getWarehouseLocations']);
    Route::post('/warehouse-locations', [ProductInventoryController::class, 'storeWarehouseLocation']);
    Route::get('/batches', [ProductInventoryController::class, 'getBatches']);
    Route::post('/batches', [ProductInventoryController::class, 'storeBatch']);
    Route::get('/serials', [ProductInventoryController::class, 'getSerialNumbers']);
    Route::post('/serials', [ProductInventoryController::class, 'storeSerialNumber']);
    Route::get('/unit-conversions', [ProductInventoryController::class, 'getUnitConversions']);
    Route::post('/unit-conversions', [ProductInventoryController::class, 'storeUnitConversion']);

    // 21 & 22. Bundles & BOM Manufacturing
    Route::get('/{productId}/bundles', [ProductManufacturingController::class, 'getBundles'])->where('productId', '[0-9]+');
    Route::post('/bundles', [ProductManufacturingController::class, 'saveBundle']);
    Route::get('/{productId}/boms', [ProductManufacturingController::class, 'getBoms'])->where('productId', '[0-9]+');
    Route::post('/boms', [ProductManufacturingController::class, 'saveBom']);

    // 28 & 31. QC Inspections & Reviews
    Route::get('/qc-inspections', [ProductQualityController::class, 'getQcInspections']);
    Route::post('/qc-inspections', [ProductQualityController::class, 'storeQcInspection']);
    Route::get('/reviews', [ProductQualityController::class, 'getReviews']);
    Route::patch('/reviews/{id}/status', [ProductQualityController::class, 'updateReviewStatus'])->where('id', '[0-9]+');

    // 40. Analytics
    Route::get('/analytics', [ProductAnalyticsController::class, 'getAnalytics']);
});