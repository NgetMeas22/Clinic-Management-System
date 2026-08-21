<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedicalRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Exception;

class MedicalRecordController extends Controller
{
    private function isDoctor(Request $request): bool
    {
        return optional($request->user()->loadMissing('role')->role)->name === 'Doctor';
    }

    private function doctorId(Request $request): ?int
    {
        return optional($request->user()->loadMissing('doctor')->doctor)->id;
    }

    private function forbidden()
    {
        return response()->json(['message' => 'Forbidden'], 403);
    }

    public function index(Request $request)
    {
        try {
            $perPage = min(max((int) $request->query('per_page', 10), 1), 200);

            $query = MedicalRecord::query()
                ->select([
                    'id', 'patient_id', 'doctor_id', 'appointment_id',
                    'symptoms', 'diagnosis', 'treatment', 'notes', 'created_at',
                ])
                ->with([
                    'patient:id,first_name,last_name,patient_code,gender,date_of_birth,phone,profile_picture',
                    'doctor:id,user_id,specialization',
                    'doctor.user:id,name,email,avatar',
                    'appointment:id,patient_id,doctor_id,appointment_date,appointment_time,status',
                    'prescriptions:id,medical_record_id,prescription_date,notes',
                    'prescriptions.items:id,prescription_id,medicine_id,quantity,dosage,frequency,duration,instruction',
                    'prescriptions.items.medicine:id,name,category,unit,price',
                ]);

            if ($request->filled('patient_id')) {
                $query->where('patient_id', $request->patient_id);
            }

            if ($request->filled('doctor_id')) {
                $query->where('doctor_id', $request->doctor_id);
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('diagnosis', 'like', "%{$search}%")
                        ->orWhereHas('patient', function ($p) use ($search) {
                            $p->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('doctor.user', function ($d) use ($search) {
                            $d->where('name', 'like', "%{$search}%");
                        });
                });
            }

            if ($request->filled('diagnosis')) {
                $query->where('diagnosis', $request->diagnosis);
            }

            if ($this->isDoctor($request)) {
                $doctorId = $this->doctorId($request);

                if (!$doctorId) {
                    return response()->json([
                        'success' => true,
                        'data' => MedicalRecord::query()->where('id', 0)->paginate($perPage),
                    ], 200);
                }

                $query->where('doctor_id', $doctorId);
            }

            $records = $query
                ->latest()
                ->paginate($perPage);

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
            if ($this->isDoctor($request)) {
                $doctorId = $this->doctorId($request);

                if (!$doctorId || (int) $request->doctor_id !== $doctorId) {
                    return $this->forbidden();
                }
            }

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

    public function show(Request $request, MedicalRecord $medicalRecord)
    {
        try {
            if ($this->isDoctor($request) && $medicalRecord->doctor_id !== $this->doctorId($request)) {
                return $this->forbidden();
            }

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
            'appointment_id' => 'nullable|exists:appointments,id',
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
            if ($this->isDoctor($request)) {
                $doctorId = $this->doctorId($request);

                if (!$doctorId || $medicalRecord->doctor_id !== $doctorId || (int) $request->doctor_id !== $doctorId) {
                    return $this->forbidden();
                }
            }

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
