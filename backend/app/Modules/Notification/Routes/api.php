<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Notification\Http\Controllers\NotificationController;

Route::prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
});
