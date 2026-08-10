<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedicalRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Exception;

class MedicalRecordController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = MedicalRecord::with([
                'patient',
                'doctor.user',
                'appointment',
                'prescriptions.items.medicine'
            ]);

            if ($request->filled('patient_id')) {
                $query->where('patient_id', $request->patient_id);
            }

            if ($request->filled('doctor_id')) {
                $query->where('doctor_id', $request->doctor_id);
            }

            $records = $query
                ->latest()
                ->paginate(10);

            return response()->json([
                'success' => true,
                'data' => $records,
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch medical records.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'required|exists:doctors,id',
            'appointment_id' => 'required|exists:appointments,id',
            'symptoms' => 'required|string',
            'diagnosis' => 'required|string',
            'treatment' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $record = MedicalRecord::create(
                $validator->validated()
            );

            $record->load([
                'patient',
                'doctor.user',
                'appointment'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Medical record created successfully.',
                'data' => $record,
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create medical record.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(MedicalRecord $medicalRecord)
    {
        try {
            $medicalRecord->load([
                'patient',
                'doctor.user',
                'appointment',
                'prescriptions.items.medicine'
            ]);

            return response()->json([
                'success' => true,
                'data' => $medicalRecord,
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch medical record.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, MedicalRecord $medicalRecord)
    {
        $validator = Validator::make($request->all(), [
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'required|exists:doctors,id',
            'appointment_id' => 'required|exists:appointments,id',
            'symptoms' => 'required|string',
            'diagnosis' => 'required|string',
            'treatment' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $medicalRecord->update(
                $validator->validated()
            );

            $medicalRecord->load([
                'patient',
                'doctor.user',
                'appointment'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Medical record updated successfully.',
                'data' => $medicalRecord,
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update medical record.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(MedicalRecord $medicalRecord)
    {
        try {
            $medicalRecord->delete();

            return response()->json([
                'success' => true,
                'message' => 'Medical record deleted successfully.',
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete medical record.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
