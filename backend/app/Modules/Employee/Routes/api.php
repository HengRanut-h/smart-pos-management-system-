<?php

use App\Modules\Employee\Http\Controllers\EmployeeController;
use App\Modules\Employee\Http\Controllers\AttendanceController;
use Illuminate\Support\Facades\Route;

// Attendance & Scanner Time Clock Routes
Route::get('/attendances', [AttendanceController::class, 'index']);
Route::get('/attendances/report', [AttendanceController::class, 'report']);
Route::get('/attendances/store-qr', [AttendanceController::class, 'storeQr']);
Route::post('/attendances/scan', [AttendanceController::class, 'scan']);
Route::post('/attendances/scan-store', [AttendanceController::class, 'scanStore']);
Route::post('/attendances/manual', [AttendanceController::class, 'manual']);
Route::put('/attendances/{id}/notes', [AttendanceController::class, 'updateRecordNotes']);

// Admin Store QR Codes Management Routes
Route::get('/attendances/qr-codes', [AttendanceController::class, 'indexQrCodes']);
Route::post('/attendances/qr-codes', [AttendanceController::class, 'storeQrCode']);
Route::post('/attendances/qr-codes/{id}/regenerate', [AttendanceController::class, 'regenerateQrCode']);
Route::patch('/attendances/qr-codes/{id}/status', [AttendanceController::class, 'updateQrCodeStatus']);
Route::delete('/attendances/qr-codes/{id}', [AttendanceController::class, 'deleteQrCode']);



// Staff Directory CRUD
Route::post('/employees/upload-avatar', [EmployeeController::class, 'uploadAvatar']);
Route::get('/employees', [EmployeeController::class, 'index']);
Route::post('/employees', [EmployeeController::class, 'store']);
Route::get('/employees/{id}', [EmployeeController::class, 'show']);
Route::put('/employees/{id}', [EmployeeController::class, 'update']);
Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);

