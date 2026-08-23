<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Appointment;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $data = Cache::remember(
            'dashboard:index:' . today()->toDateString(),
            now()->addSeconds(60),
            function () {
                return [
                    'total_patients' => Patient::count(),
                    'total_doctors' => Doctor::count(),
                    'appointments_today' => Appointment::whereDate('appointment_date', today())->count(),
                    'total_revenue' => Payment::sum('amount'),
                ];
            }
        );

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function weekly(): JsonResponse
    {
        $key = 'dashboard:weekly:' . today()->toDateString();

        $data = Cache::remember($key, now()->addSeconds(60), function () {
            $startOfWeek = now()->startOfWeek()->toDateString();
            $endOfWeek = now()->endOfWeek()->toDateString();

            $patients = Patient::select(
                DB::raw('WEEKDAY(created_at) + 1 as weekday'),
                DB::raw('COUNT(*) as total')
            )
                ->whereBetween(DB::raw('DATE(created_at)'), [$startOfWeek, $endOfWeek])
                ->groupBy(DB::raw('WEEKDAY(created_at) + 1'))
                ->orderBy('weekday')
                ->get();

            $appointments = Appointment::select(
                DB::raw('WEEKDAY(appointment_date) + 1 as weekday'),
                DB::raw('COUNT(*) as total')
            )
                ->whereBetween('appointment_date', [$startOfWeek, $endOfWeek])
                ->groupBy(DB::raw('WEEKDAY(appointment_date) + 1'))
                ->orderBy('weekday')
                ->get();

            $revenue = Payment::select(
                DB::raw('WEEKDAY(payment_date) + 1 as weekday'),
                DB::raw('COALESCE(SUM(amount), 0) as total')
            )
                ->whereBetween('payment_date', [$startOfWeek, $endOfWeek])
                ->groupBy(DB::raw('WEEKDAY(payment_date) + 1'))
                ->orderBy('weekday')
                ->get();

            return [
                'patients' => $patients,
                'appointments' => $appointments,
                'revenue' => $revenue,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function dailyThisMonth(): JsonResponse
    {
        $key = 'dashboard:daily:' . now()->format('Y-m');

        $data = Cache::remember($key, now()->addSeconds(60), function () {
            $patients = Patient::select(
                DB::raw('DAY(created_at) as day'),
                DB::raw('COUNT(*) as total')
            )
                ->whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->groupBy(DB::raw('DAY(created_at)'))
                ->orderBy('day')
                ->get();

            $appointments = Appointment::select(
                DB::raw('DAY(appointment_date) as day'),
                DB::raw('COUNT(*) as total')
            )
                ->whereYear('appointment_date', now()->year)
                ->whereMonth('appointment_date', now()->month)
                ->groupBy(DB::raw('DAY(appointment_date)'))
                ->orderBy('day')
                ->get();

            $revenue = Payment::select(
                DB::raw('DAY(payment_date) as day'),
                DB::raw('COALESCE(SUM(amount), 0) as total')
            )
                ->whereYear('payment_date', now()->year)
                ->whereMonth('payment_date', now()->month)
                ->groupBy(DB::raw('DAY(payment_date)'))
                ->orderBy('day')
                ->get();

            return [
                'patients' => $patients,
                'appointments' => $appointments,
                'revenue' => $revenue,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function monthly(): JsonResponse
    {
        $key = 'dashboard:monthly:' . now()->year;

        $data = Cache::remember($key, now()->addSeconds(60), function () {
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
                DB::raw('COALESCE(SUM(amount), 0) as total')
            )
                ->whereYear('payment_date', now()->year)
                ->groupBy(DB::raw('MONTH(payment_date)'))
                ->orderBy('month')
                ->get();

            return [
                'patients' => $patients,
                'appointments' => $appointments,
                'revenue' => $revenue,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
