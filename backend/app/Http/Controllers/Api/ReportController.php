<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Appointment;
use App\Models\Payment;
use App\Models\Medicine;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function patients(Request $request)
    {
        $query = Patient::query();

        if ($request->filled('from')) {
            $query->whereDate(
                'created_at',
                '>=',
                $request->from
            );
        }

        if ($request->filled('to')) {
            $query->whereDate(
                'created_at',
                '<=',
                $request->to
            );
        }

        return response()->json([
            'success' => true,
            'data' => $query->latest()->get(),
        ]);
    }

    public function doctors(Request $request)
    {
        $query = Doctor::with('user', 'department');

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function appointments(Request $request)
    {
        $query = Appointment::with([
            'patient',
            'doctor'
        ]);

        if ($request->filled('from')) {
            $query->whereDate(
                'appointment_date',
                '>=',
                $request->from
            );
        }

        if ($request->filled('to')) {
            $query->whereDate(
                'appointment_date',
                '<=',
                $request->to
            );
        }

        return response()->json([
            'success' => true,
            'data' => $query
                ->orderBy('appointment_date', 'desc')
                ->get(),
        ]);
    }

    public function payments(Request $request)
    {
        $query = Payment::query();

        if ($request->filled('from')) {
            $query->whereDate(
                'payment_date',
                '>=',
                $request->from
            );
        }

        if ($request->filled('to')) {
            $query->whereDate(
                'payment_date',
                '<=',
                $request->to
            );
        }

        return response()->json([
            'success' => true,
            'data' => $query->latest()->get(),
        ]);
    }

    public function medicines()
    {
        return response()->json([
            'success' => true,
            'data' => Medicine::latest()->get(),
        ]);
    }
}
