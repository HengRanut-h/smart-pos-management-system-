<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Delivery\Http\Controllers\DeliveryDashboardController;
use App\Modules\Delivery\Http\Controllers\DeliveryOrderController;
use App\Modules\Delivery\Http\Controllers\DeliveryStaffController;
use App\Modules\Delivery\Http\Controllers\DeliveryZoneController;
use App\Modules\Delivery\Http\Controllers\DeliveryCodSettlementController;
use App\Modules\Delivery\Http\Controllers\DeliveryReportController;

Route::prefix('delivery')->group(function () {
    // 1. Dashboard
    Route::get('/dashboard', [DeliveryDashboardController::class, 'index']);

    // 2. Orders
    Route::get('/orders', [DeliveryOrderController::class, 'index']);
    Route::post('/orders', [DeliveryOrderController::class, 'store']);
    Route::get('/orders/{id}', [DeliveryOrderController::class, 'show']);
    Route::patch('/orders/{id}/status', [DeliveryOrderController::class, 'updateStatus']);
    Route::post('/orders/{id}/assign', [DeliveryOrderController::class, 'assignDriver']);
    Route::post('/orders/{id}/proof', [DeliveryOrderController::class, 'submitProof']);
    Route::post('/orders/{id}/fail', [DeliveryOrderController::class, 'markFailed']);

    // 3. Delivery Staff / Drivers
    Route::get('/drivers', [DeliveryStaffController::class, 'index']);
    Route::post('/drivers', [DeliveryStaffController::class, 'store']);
    Route::patch('/drivers/{id}/status', [DeliveryStaffController::class, 'updateStatus']);

    // 4. Delivery Zones & Fees
    Route::get('/zones', [DeliveryZoneController::class, 'index']);
    Route::post('/zones', [DeliveryZoneController::class, 'store']);

    // 5. COD & Settlements
    Route::get('/settlements', [DeliveryCodSettlementController::class, 'index']);
    Route::post('/settlements', [DeliveryCodSettlementController::class, 'store']);

    // 6. Reports & Analytics
    Route::get('/reports', [DeliveryReportController::class, 'index']);
});
