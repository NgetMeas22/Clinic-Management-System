<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\MedicalRecordController;
use App\Http\Controllers\Api\MedicineController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\OtpController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PrescriptionController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\SupportController;

// Public Routes
Route::post('/login', [AuthController::class, 'login']);

Route::post('/support/send', [SupportController::class, 'sendSupportMessage']);

Route::get('/auth/google', [GoogleController::class, 'redirect']);
Route::get('/auth/google/callback', [GoogleController::class, 'callback']);

// Email OTP login (passwordless)
Route::post('/auth/otp/request', [OtpController::class, 'requestCode'])->middleware('throttle:10,1');
Route::post('/auth/otp/verify', [OtpController::class, 'verify'])->middleware('throttle:20,1');

// Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Profile
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/password', [AuthController::class, 'changePassword']);
    Route::delete('/account', [AuthController::class, 'deleteAccount']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard Routes (Admin, Doctor, Receptionist)
    Route::middleware('role:admin,doctor,receptionist')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/dashboard/weekly', [DashboardController::class, 'weekly']);
        Route::get('/dashboard/daily-this-month', [DashboardController::class, 'dailyThisMonth']);
        Route::get('/dashboard/monthly', [DashboardController::class, 'monthly']);
    });

    // Departments (FIXED: Added doctor role here)
    Route::get('/departments', [DepartmentController::class, 'index'])->middleware('role:admin,doctor,receptionist');
    Route::get('/departments/{department}', [DepartmentController::class, 'show'])->middleware('role:admin,doctor,receptionist');

    // Doctors
    Route::get('/doctors', [DoctorController::class, 'index'])->middleware('role:admin,doctor,receptionist');
    Route::get('/doctors/{doctor}', [DoctorController::class, 'show'])->middleware('role:admin,doctor,receptionist');

    // Patients
    Route::get('/patients', [PatientController::class, 'index'])->middleware('role:admin,doctor,receptionist');
    Route::get('/patients/{patient}', [PatientController::class, 'show'])->middleware('role:admin,doctor,receptionist');
    Route::post('/patients', [PatientController::class, 'store'])->middleware('role:admin,receptionist');
    Route::put('/patients/{patient}', [PatientController::class, 'update'])->middleware('role:admin,receptionist');

    // Appointments
    Route::get('/appointments', [AppointmentController::class, 'index'])->middleware('role:admin,doctor,receptionist');
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show'])->middleware('role:admin,doctor,receptionist');
    Route::put('/appointments/{appointment}', [AppointmentController::class, 'update'])->middleware('role:admin,doctor,receptionist');
    Route::post('/appointments', [AppointmentController::class, 'store'])->middleware('role:admin,receptionist');
    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy'])->middleware('role:admin');

    // Medical Records
    Route::apiResource('medical-records', MedicalRecordController::class)
        ->only(['index', 'show', 'store', 'update'])
        ->middleware('role:admin,doctor');

    // Prescriptions
    Route::apiResource('prescriptions', PrescriptionController::class)
        ->only(['index', 'show', 'store', 'update'])
        ->middleware('role:admin,doctor');

    // Medicines
    Route::get('/medicines', [MedicineController::class, 'index'])->middleware('role:admin,doctor,receptionist');
    Route::get('/medicines/{medicine}', [MedicineController::class, 'show'])->middleware('role:admin,doctor,receptionist');

    // Payments
    Route::apiResource('payments', PaymentController::class)
        ->only(['index', 'show', 'store', 'update'])
        ->middleware('role:admin,receptionist');
});

// Admin ONLY Routes
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::apiResource('users', UserController::class);

    // Admin-only management routes
    Route::post('/departments', [DepartmentController::class, 'store']);
    Route::put('/departments/{department}', [DepartmentController::class, 'update']);
    Route::delete('/departments/{department}', [DepartmentController::class, 'destroy']);

    Route::post('/doctors', [DoctorController::class, 'store']);
    Route::put('/doctors/{doctor}', [DoctorController::class, 'update']);
    Route::delete('/doctors/{doctor}', [DoctorController::class, 'destroy']);

    Route::delete('/patients/{patient}', [PatientController::class, 'destroy']);
    Route::delete('/medical-records/{medical_record}', [MedicalRecordController::class, 'destroy']);
    Route::delete('/prescriptions/{prescription}', [PrescriptionController::class, 'destroy']);

    Route::post('/medicines', [MedicineController::class, 'store']);
    Route::put('/medicines/{medicine}', [MedicineController::class, 'update']);
    Route::delete('/medicines/{medicine}', [MedicineController::class, 'destroy']);

    Route::delete('/payments/{payment}', [PaymentController::class, 'destroy']);

    // Reports
    Route::get('/reports/patients', [ReportController::class, 'patients']);
    Route::get('/reports/doctors', [ReportController::class, 'doctors']);
    Route::get('/reports/appointments', [ReportController::class, 'appointments']);
    Route::get('/reports/payments', [ReportController::class, 'payments']);
    Route::get('/reports/medicines', [ReportController::class, 'medicines']);
});
