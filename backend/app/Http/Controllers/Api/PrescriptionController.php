<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Exception;

class PrescriptionController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Prescription::with([
                'patient',
                'doctor.user',
                'medicalRecord',
                'items.medicine'
            ]);

            if ($request->filled('patient_id')) {
                $query->where('patient_id', $request->patient_id);
            }

            if ($request->filled('doctor_id')) {
                $query->where('doctor_id', $request->doctor_id);
            }

            $prescriptions = $query
                ->latest()
                ->paginate(10);

            return response()->json([
                'success' => true,
                'data' => $prescriptions,
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch prescriptions.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'required|exists:doctors,id',
            'medical_record_id' => 'required|exists:medical_records,id',
            'prescription_date' => 'required|date',
            'notes' => 'nullable|string',

            'items' => 'required|array|min:1',

            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.dosage' => 'required|string',
            'items.*.frequency' => 'required|string',
            'items.*.duration' => 'required|string',
            'items.*.instruction' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            $prescription = Prescription::create([
                'patient_id' => $request->patient_id,
                'doctor_id' => $request->doctor_id,
                'medical_record_id' => $request->medical_record_id,
                'prescription_date' => $request->prescription_date,
                'notes' => $request->notes,
            ]);

            foreach ($request->items as $item) {
                $prescription->items()->create([
                    'medicine_id' => $item['medicine_id'],
                    'quantity' => $item['quantity'],
                    'dosage' => $item['dosage'],
                    'frequency' => $item['frequency'],
                    'duration' => $item['duration'],
                    'instruction' => $item['instruction'] ?? null,
                ]);
            }

            DB::commit();

            $prescription->load([
                'patient',
                'doctor.user',
                'medicalRecord',
                'items.medicine'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Prescription created successfully.',
                'data' => $prescription,
            ], 201);

        } catch (Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create prescription.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(Prescription $prescription)
    {
        try {
            $prescription->load([
                'patient',
                'doctor.user',
                'medicalRecord',
                'items.medicine'
            ]);

            return response()->json([
                'success' => true,
                'data' => $prescription,
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch prescription.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, Prescription $prescription)
    {
        $validator = Validator::make($request->all(), [
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'required|exists:doctors,id',
            'medical_record_id' => 'required|exists:medical_records,id',
            'prescription_date' => 'required|date',
            'notes' => 'nullable|string',

            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.dosage' => 'required|string',
            'items.*.frequency' => 'required|string',
            'items.*.duration' => 'required|string',
            'items.*.instruction' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            $prescription->update([
                'patient_id' => $request->patient_id,
                'doctor_id' => $request->doctor_id,
                'medical_record_id' => $request->medical_record_id,
                'prescription_date' => $request->prescription_date,
                'notes' => $request->notes,
            ]);

            $prescription->items()->delete();

            foreach ($request->items as $item) {
                $prescription->items()->create([
                    'medicine_id' => $item['medicine_id'],
                    'quantity' => $item['quantity'],
                    'dosage' => $item['dosage'],
                    'frequency' => $item['frequency'],
                    'duration' => $item['duration'],
                    'instruction' => $item['instruction'] ?? null,
                ]);
            }

            DB::commit();

            $prescription->load([
                'patient',
                'doctor.user',
                'medicalRecord',
                'items.medicine'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Prescription updated successfully.',
                'data' => $prescription,
            ]);

        } catch (Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to update prescription.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Prescription $prescription)
    {
        try {
            $prescription->delete();

            return response()->json([
                'success' => true,
                'message' => 'Prescription deleted successfully.',
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete prescription.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
