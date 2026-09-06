<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Discount\Http\Controllers\CouponController;

Route::get('/coupons', [CouponController::class, 'index']);
Route::post('/coupons/validate', [CouponController::class, 'validateCoupon']);
