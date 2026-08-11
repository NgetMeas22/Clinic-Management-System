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
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/password', [AuthController::class, 'changePassword']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware('role:admin,doctor,receptionist');
    Route::get('/dashboard/weekly', [DashboardController::class, 'weekly'])
        ->middleware('role:admin,doctor,receptionist');
    Route::get('/dashboard/daily-this-month', [DashboardController::class, 'dailyThisMonth'])
        ->middleware('role:admin,doctor,receptionist');
    Route::get('/dashboard/monthly', [DashboardController::class, 'monthly'])
        ->middleware('role:admin,doctor,receptionist');

    Route::apiResource('departments', DepartmentController::class)
        ->only(['index', 'show'])
        ->middleware('role:admin,receptionist');
    Route::apiResource('departments', DepartmentController::class)
        ->only(['store', 'update', 'destroy'])
        ->middleware('role:admin');

    Route::apiResource('doctors', DoctorController::class)
        ->only(['index', 'show'])
        ->middleware('role:admin,doctor,receptionist');
    Route::apiResource('doctors', DoctorController::class)
        ->only(['store', 'update', 'destroy'])
        ->middleware('role:admin');

    Route::apiResource('patients', PatientController::class)
        ->only(['index', 'show'])
        ->middleware('role:admin,doctor,receptionist');
    Route::apiResource('patients', PatientController::class)
        ->only(['store', 'update'])
        ->middleware('role:admin,receptionist');
    Route::apiResource('patients', PatientController::class)
        ->only(['destroy'])
        ->middleware('role:admin');

    Route::apiResource('appointments', AppointmentController::class)
        ->only(['index', 'show', 'update'])
        ->middleware('role:admin,doctor,receptionist');
    Route::apiResource('appointments', AppointmentController::class)
        ->only(['store'])
        ->middleware('role:admin,receptionist');
    Route::apiResource('appointments', AppointmentController::class)
        ->only(['destroy'])
        ->middleware('role:admin');

    Route::apiResource('medical-records', MedicalRecordController::class)
        ->only(['index', 'show', 'store', 'update'])
        ->middleware('role:admin,doctor');
    Route::apiResource('medical-records', MedicalRecordController::class)
        ->only(['destroy'])
        ->middleware('role:admin');

    Route::apiResource('prescriptions', PrescriptionController::class)
        ->only(['index', 'show', 'store', 'update'])
        ->middleware('role:admin,doctor');
    Route::apiResource('prescriptions', PrescriptionController::class)
        ->only(['destroy'])
        ->middleware('role:admin');

    Route::apiResource('medicines', MedicineController::class)
        ->only(['index', 'show'])
        ->middleware('role:admin,doctor,receptionist');
    Route::apiResource('medicines', MedicineController::class)
        ->only(['store', 'update', 'destroy'])
        ->middleware('role:admin');

    Route::apiResource('payments', PaymentController::class)
        ->only(['index', 'show', 'store', 'update'])
        ->middleware('role:admin,receptionist');
    Route::apiResource('payments', PaymentController::class)
        ->only(['destroy'])
        ->middleware('role:admin');
});

// Admin-ONLY Routes
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/reports/patients', [ReportController::class, 'patients']);
    Route::get('/reports/doctors', [ReportController::class, 'doctors']);
    Route::get('/reports/appointments', [ReportController::class, 'appointments']);
    Route::get('/reports/payments', [ReportController::class, 'payments']);
    Route::get('/reports/medicines', [ReportController::class, 'medicines']);
});
