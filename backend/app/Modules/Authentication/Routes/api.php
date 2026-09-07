<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Authentication\Http\Controllers\AuthController;
use App\Modules\Authentication\Http\Controllers\OtpController;
use App\Modules\Authentication\Http\Controllers\GoogleAuthController;
use App\Modules\Authentication\Http\Controllers\TelegramAuthController;

Route::prefix('auth')->group(function () {
    // Core Auth
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    // OTP Verification & Resend Endpoints
    Route::post('/send-otp', [AuthController::class, 'sendOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/verify-registration-otp', [AuthController::class, 'verifyRegistrationOtp']);
    Route::post('/resend-registration-otp', [AuthController::class, 'resendRegistrationOtp']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/verify-reset-otp', [AuthController::class, 'verifyResetOtp']);
    Route::post('/resend-reset-otp', [AuthController::class, 'resendResetOtp']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    // Dedicated Domain OtpController Endpoints
    Route::prefix('otp')->group(function () {
        Route::post('/send', [OtpController::class, 'send']);
        Route::post('/verify', [OtpController::class, 'verify']);
        Route::post('/reset-password', [OtpController::class, 'resetPassword']);
    });

    // Google OAuth Routes
    Route::prefix('google')->group(function () {
        Route::get('/', [GoogleAuthController::class, 'redirect']);
        Route::get('/redirect', [GoogleAuthController::class, 'redirect']);
        Route::match(['get', 'post'], '/callback', [GoogleAuthController::class, 'callback']);
    });

    // Telegram SSO Routes
    Route::prefix('telegram')->group(function () {
        Route::get('/bot-info', [TelegramAuthController::class, 'botInfo']);
        Route::match(['get', 'post'], '/callback', [TelegramAuthController::class, 'callback']);
    });

    // Generic OAuth Routes
    Route::get('/oauth/{provider}/redirect', [AuthController::class, 'oauthRedirect']);
    Route::post('/oauth/{provider}/callback', [AuthController::class, 'oauthCallback']);

    // Authenticated Sessions & Profile
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});
