<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Exception;

class PatientController extends Controller
{
    /**
     * GET /api/patients
     */
    public function index(Request $request)
    {
        try {
            $query = Patient::query();

            // Search
            if ($request->filled('search')) {
                $search = $request->search;

                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('patient_code', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            $perPage = min(max((int) $request->query('per_page', 10), 1), 200);

            $patients = $query
                ->select([
                    'id', 'patient_code', 'first_name', 'last_name', 'gender',
                    'date_of_birth', 'blood_group', 'phone', 'email', 'profile_picture',
                    'address', 'emergency_contact', 'emergency_phone', 'status', 'created_at',
                ])
                ->latest()
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Patients retrieved successfully',
                'data' => $patients
            ], 200);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve patients',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * POST /api/patients
     */
    public function store(Request $request)
    {
        try {

            $validated = $request->validate([
                'patient_code' => 'required|string|max:30|unique:patients,patient_code',
                'first_name' => 'required|string|max:100',
                'last_name' => 'required|string|max:100',
                'gender' => 'required|in:male,female,other',
                'date_of_birth' => 'nullable|date',
                'blood_group' => 'nullable|string|max:5',
                'phone' => 'nullable|string|max:30',
                'email' => 'nullable|email|max:150',
                'address' => 'nullable|string',
                'emergency_contact' => 'nullable|string|max:100',
                'emergency_phone' => 'nullable|string|max:30',
                'avatar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
                'status' => 'nullable|in:active,inactive',
            ]);

            $profilePicture = $request->hasFile('avatar')
                ? $request->file('avatar')->store('patient-pictures', 'public')
                : null;

            $patient = Patient::create(array_merge($validated, [
                'profile_picture' => $profilePicture,
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Patient created successfully',
                'data' => $patient
            ], 201);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to create patient',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * GET /api/patients/{id}
     */
    public function show($id)
    {
        try {

            $patient = Patient::findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Patient retrieved successfully',
                'data' => $patient
            ], 200);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Patient not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }


    /**
     * PUT /api/patients/{id}
     */
    public function update(Request $request, $id)
    {
        try {

            $patient = Patient::findOrFail($id);

            $validated = $request->validate([
                'patient_code' => 'required|string|max:30|unique:patients,patient_code,' . $id,
                'first_name' => 'required|string|max:100',
                'last_name' => 'required|string|max:100',
                'gender' => 'required|in:male,female,other',
                'date_of_birth' => 'nullable|date',
                'blood_group' => 'nullable|string|max:5',
                'phone' => 'nullable|string|max:30',
                'email' => 'nullable|email|max:150',
                'address' => 'nullable|string',
                'emergency_contact' => 'nullable|string|max:100',
                'emergency_phone' => 'nullable|string|max:30',
                'avatar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
                'status' => 'nullable|in:active,inactive',
            ]);

            $profilePicture = $patient->profile_picture;

            if ($request->hasFile('avatar')) {
                if ($patient->profile_picture) {
                    Storage::disk('public')->delete($patient->profile_picture);
                }
                $profilePicture = $request->file('avatar')->store('patient-pictures', 'public');
            }

            $patient->update(array_merge($validated, [
                'profile_picture' => $profilePicture,
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Patient updated successfully',
                'data' => $patient
            ], 200);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to update patient',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * DELETE /api/patients/{id}
     */
    public function destroy($id)
    {
        try {

            $patient = Patient::findOrFail($id);

            $patient->delete();

            return response()->json([
                'success' => true,
                'message' => 'Patient deleted successfully'
            ], 200);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete patient',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
