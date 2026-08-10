<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;
// use Nette\Schema\ValidationException;
use Illuminate\Validation\ValidationException;
use Throwable;

class AppointmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
  // GET /api/appointments
    public function index(Request $request)
    {
        try {
            $query = Appointment::with([
                'patient',
                'doctor'
            ]);

            // Search
            if ($request->filled('search')) {
                $search = $request->search;

                $query->whereHas('patient', function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%");
                });
            }

            // Filter status
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            $appointments = $query
                ->latest()
                ->paginate(10);

            return response()->json([
                'success' => true,
                'data' => $appointments
            ], 200);

        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve appointments.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // POST /api/appointments
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'patient_id' => 'required|exists:patients,id',
                'doctor_id' => 'required|exists:doctors,id',
                'appointment_date' => 'required|date',
                'appointment_time' => 'required',
                'reason' => 'nullable|string',
                'status' => 'nullable|in:pending,confirmed,completed,cancelled',
    ]);

            $appointment = Appointment::create($validated);

            $appointment->load([
                'patient',
                'doctor'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Appointment created successfully.',
                'data' => $appointment
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors()
            ], 422);

        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create appointment.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/appointments/{id}
    public function show(Appointment $appointment)
    {
        try {
            $appointment->load([
                'patient',
                'doctor'
            ]);

            return response()->json([
                'success' => true,
                'data' => $appointment
            ], 200);

        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch appointment details.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // PUT /api/appointments/{id}
    public function update(Request $request, Appointment $appointment)
    {
        try {
            $validated = $request->validate([
                'patient_id' => 'sometimes|required|exists:patients,id',
                'doctor_id' => 'sometimes|required|exists:doctors,id',
                'appointment_date' => 'sometimes|required|date',
                'appointment_time' => 'sometimes|required',
                'reason' => 'nullable|string',
                'status' => 'sometimes|required|in:pending,confirmed,completed,cancelled',
            ]);

            $appointment->update($validated);

            $appointment->load([
                'patient',
                'doctor'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Appointment updated successfully.',
                'data' => $appointment
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors()
            ], 422);

        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update appointment.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/appointments/{id}
    public function destroy(Appointment $appointment)
    {
        try {
            $appointment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Appointment deleted successfully.'
            ], 200);

        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete appointment.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
