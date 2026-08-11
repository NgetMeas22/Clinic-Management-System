<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Appointment;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function monthly()
{
    $patients = Patient::select(
        DB::raw('MONTH(created_at) as month'),
        DB::raw('COUNT(*) as total')
    )
        ->whereYear('created_at', now()->year)
        ->groupBy(DB::raw('MONTH(created_at)'))
        ->orderBy('month')
        ->get();

    $appointments = Appointment::select(
        DB::raw('MONTH(appointment_date) as month'),
        DB::raw('COUNT(*) as total')
    )
        ->whereYear('appointment_date', now()->year)
        ->groupBy(DB::raw('MONTH(appointment_date)'))
        ->orderBy('month')
        ->get();

    $revenue = Payment::select(
        DB::raw('MONTH(payment_date) as month'),
        DB::raw('SUM(amount) as total')
    )
        ->whereYear('payment_date', now()->year)
        ->groupBy(DB::raw('MONTH(payment_date)'))
        ->orderBy('month')
        ->get();

    return response()->json([
        'success' => true,
        'data' => [
            'patients' => $patients,
            'appointments' => $appointments,
            'revenue' => $revenue,
        ],
    ]);
}
    public function index(): JsonResponse
    {
        $totalPatients = Patient::count();

        $totalDoctors = Doctor::count();

        $appointmentsToday = Appointment::whereDate(
            'appointment_date',
            today()
        )->count();

        $totalRevenue = Payment::sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'total_patients' => $totalPatients,
                'total_doctors' => $totalDoctors,
                'appointments_today' => $appointmentsToday,
                'total_revenue' => $totalRevenue,
            ],
        ]);
    }
}
