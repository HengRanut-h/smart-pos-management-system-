<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Delivery\Http\Controllers\DeliveryDashboardController;
use App\Modules\Delivery\Http\Controllers\DeliveryOrderController;
use App\Modules\Delivery\Http\Controllers\DeliveryStaffController;
use App\Modules\Delivery\Http\Controllers\DeliveryZoneController;
use App\Modules\Delivery\Http\Controllers\DeliveryCodSettlementController;
use App\Modules\Delivery\Http\Controllers\DeliveryReportController;
use App\Modules\Delivery\Http\Controllers\DeliveryVehicleController;
use App\Modules\Delivery\Http\Controllers\DeliveryRouteController;
use App\Modules\Delivery\Http\Controllers\DeliveryTimeSlotController;
use App\Modules\Delivery\Http\Controllers\CustomerAddressController;
use App\Modules\Delivery\Http\Controllers\DeliverySupportController;
use App\Modules\Delivery\Http\Controllers\DeliveryRatingController;
use App\Modules\Delivery\Http\Controllers\DeliveryAnalyticsController;

Route::prefix('delivery')->group(function () {
    // 1. Dashboard & Live Metrics
    Route::get('/dashboard', [DeliveryDashboardController::class, 'index']);

    // 2. Orders & Operations
    Route::get('/orders', [DeliveryOrderController::class, 'index']);
    Route::post('/orders', [DeliveryOrderController::class, 'store']);
    Route::post('/orders/from-sale', [DeliveryOrderController::class, 'generateFromSale']);
    Route::post('/orders/bulk-assign', [DeliveryOrderController::class, 'bulkAssign']);
    Route::get('/orders/{id}', [DeliveryOrderController::class, 'show']);
    Route::patch('/orders/{id}/status', [DeliveryOrderController::class, 'updateStatus']);
    Route::post('/orders/{id}/assign', [DeliveryOrderController::class, 'assignDriver']);
    Route::post('/orders/{id}/reschedule', [DeliveryOrderController::class, 'reschedule']);
    Route::post('/orders/{id}/return', [DeliveryOrderController::class, 'processReturn']);
    Route::post('/orders/{id}/proof', [DeliveryOrderController::class, 'submitProof']);
    Route::post('/orders/{id}/fail', [DeliveryOrderController::class, 'markFailed']);

    // 3. Delivery Staff / Drivers
    Route::get('/drivers', [DeliveryStaffController::class, 'index']);
    Route::post('/drivers', [DeliveryStaffController::class, 'store']);
    Route::patch('/drivers/{id}/status', [DeliveryStaffController::class, 'updateStatus']);

    // 4. Vehicles & Maintenance
    Route::get('/vehicles', [DeliveryVehicleController::class, 'index']);
    Route::post('/vehicles', [DeliveryVehicleController::class, 'store']);
    Route::put('/vehicles/{id}', [DeliveryVehicleController::class, 'update']);
    Route::patch('/vehicles/{id}/status', [DeliveryVehicleController::class, 'updateStatus']);
    Route::post('/vehicles/{id}/maintenance', [DeliveryVehicleController::class, 'addMaintenance']);

    // 5. Multi-Stop Route Management
    Route::get('/routes', [DeliveryRouteController::class, 'index']);
    Route::post('/routes', [DeliveryRouteController::class, 'store']);
    Route::post('/routes/{id}/optimize', [DeliveryRouteController::class, 'optimize']);

    // 6. Delivery Zones & Fee Rules
    Route::get('/zones', [DeliveryZoneController::class, 'index']);
    Route::post('/zones', [DeliveryZoneController::class, 'store']);
    Route::get('/fee-rules', [DeliveryOrderController::class, 'getFeeRules']);
    Route::post('/fee-rules', [DeliveryOrderController::class, 'saveFeeRule']);

    // 7. Time Slots
    Route::get('/time-slots', [DeliveryTimeSlotController::class, 'index']);
    Route::post('/time-slots', [DeliveryTimeSlotController::class, 'store']);

    // 8. Customer Addresses
    Route::get('/addresses', [CustomerAddressController::class, 'index']);
    Route::post('/addresses', [CustomerAddressController::class, 'store']);

    // 9. Issues & Support Tickets
    Route::get('/support-tickets', [DeliverySupportController::class, 'index']);
    Route::post('/support-tickets', [DeliverySupportController::class, 'store']);
    Route::post('/support-tickets/{id}/resolve', [DeliverySupportController::class, 'resolve']);

    // 10. Ratings & Reviews
    Route::get('/ratings', [DeliveryRatingController::class, 'index']);
    Route::post('/ratings', [DeliveryRatingController::class, 'store']);

    // 11. COD Settlements
    Route::get('/settlements', [DeliveryCodSettlementController::class, 'index']);
    Route::post('/settlements', [DeliveryCodSettlementController::class, 'store']);

    // 12. Reports & Analytics
    Route::get('/reports', [DeliveryReportController::class, 'index']);
    Route::get('/analytics', [DeliveryAnalyticsController::class, 'index']);
});
