<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\MedicalRecordController;
use App\Http\Controllers\Api\MedicineController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PrescriptionController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\AppointmentController;

// Public Routes
Route::post('/login', [AuthController::class, 'login']);

// Routes for ALL authenticated users (Patients, Doctors, Admins, etc.)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('departments', DepartmentController::class);
    Route::apiResource('doctors', DoctorController::class);
    Route::apiResource('patients', PatientController::class);
    Route::apiResource('appointments', AppointmentController::class);
    Route::apiResource('medical-records', MedicalRecordController::class);
    Route::apiResource('prescriptions', PrescriptionController::class);
    Route::apiResource('medicines', MedicineController::class);
    Route::apiResource('payments', PaymentController::class);
});

// Admin-ONLY Routes
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/monthly', [DashboardController::class, 'monthly']);

    Route::get('/reports/patients', [ReportController::class, 'patients']);
    Route::get('/reports/doctors', [ReportController::class, 'doctors']);
    Route::get('/reports/appointments', [ReportController::class, 'appointments']);
    Route::get('/reports/payments', [ReportController::class, 'payments']);
    Route::get('/reports/medicines', [ReportController::class, 'medicines']);
});
