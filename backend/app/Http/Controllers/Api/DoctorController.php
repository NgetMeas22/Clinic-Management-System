<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Exception;

class DoctorController extends Controller
{
    /**
     * GET /api/doctors
     */
    public function index(Request $request)
    {
        try {
            $query = Doctor::with(['user', 'department']);

            if ($request->filled('search')) {
                $search = $request->search;

                $query->whereHas('user', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            $doctors = $query
                ->latest()
                ->paginate(10);

            return response()->json([
                'success' => true,
                'message' => 'Doctors retrieved successfully',
                'data' => $doctors
            ], 200);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve doctors',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * POST /api/doctors
     */
    public function store(Request $request)
    {
        try {

            $validated = $request->validate([
                'name' => 'required|string|max:100',
                'email' => 'required|email|max:150|unique:users,email',
                'phone' => 'nullable|string|max:30',

                'department_id' => 'required|exists:departments,id',
                'specialization' => 'required|string|max:150',
                'license_number' => 'required|string|max:100|unique:doctors,license_number',

                'gender' => 'required|in:male,female,other',
                'date_of_birth' => 'nullable|date',
                'address' => 'nullable|string',
                'status' => 'required|in:active,inactive,on_leave',
            ]);

            $doctor = DB::transaction(function () use ($validated) {
                $doctorRole = Role::where('name', 'Doctor')->firstOrFail();

                // users.status only supports active/inactive, while doctors.status
                // also supports on_leave — keep the two independent.
                $userStatus = $validated['status'] === 'inactive' ? 'inactive' : 'active';

                $user = User::create([
                    'role_id' => $doctorRole->id,
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => Hash::make('doctor7777'),
                    'phone' => $validated['phone'] ?? null,
                    'status' => $userStatus,
                ]);

                return Doctor::create([
                    'user_id' => $user->id,
                    'department_id' => $validated['department_id'],
                    'specialization' => $validated['specialization'],
                    'license_number' => $validated['license_number'],
                    'gender' => $validated['gender'],
                    'date_of_birth' => $validated['date_of_birth'] ?? null,
                    'address' => $validated['address'] ?? null,
                    'status' => $validated['status'] ?? 'active',
                ]);
            });

            $doctor->load(['user', 'department']);

            return response()->json([
                'success' => true,
                'message' => 'Doctor created successfully',
                'data' => $doctor
            ], 201);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to create doctor',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * GET /api/doctors/{id}
     */
    public function show($id)
    {
        try {

            $doctor = Doctor::with([
                'user',
                'department'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Doctor retrieved successfully',
                'data' => $doctor
            ], 200);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Doctor not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }


    /**
     * PUT /api/doctors/{id}
     */
    public function update(Request $request, $id)
    {
        try {

            $doctor = Doctor::with('user')->findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:100',
                'email' => 'required|email|max:150|unique:users,email,' . $doctor->user_id,
                'phone' => 'nullable|string|max:30',

                'department_id' => 'required|exists:departments,id',
                'specialization' => 'required|string|max:150',
                'license_number' => 'required|string|max:100|unique:doctors,license_number,' . $id,

                'gender' => 'required|in:male,female,other',
                'date_of_birth' => 'nullable|date',
                'address' => 'nullable|string',
                'status' => 'nullable|in:active,inactive,on_leave',
            ]);

            DB::transaction(function () use ($doctor, $validated) {

                // users.status only supports active/inactive, while doctors.status
                // also supports on_leave — keep the two independent.
                $userStatus = $validated['status'] === 'inactive' ? 'inactive' : 'active';

                if ($doctor->user) {
                    // Update User
                    $doctor->user->update([
                        'name' => $validated['name'],
                        'email' => $validated['email'],
                        'phone' => $validated['phone'] ?? null,
                        'status' => $userStatus,
                    ]);
                } else {
                    // Re-attach an orphaned doctor (its user was deleted) so the
                    // record becomes editable and keepable again.
                    $role = Role::where('name', 'Doctor')->firstOrFail();
                    $user = User::create([
                        'role_id' => $role->id,
                        'name' => $validated['name'],
                        'email' => $validated['email'],
                        'phone' => $validated['phone'] ?? null,
                        'password' => Hash::make('doctor7777'),
                        'status' => $userStatus,
                    ]);
                    $doctor->update(['user_id' => $user->id]);
                }

                // Update Doctor
                $doctor->update([
                    'department_id' => $validated['department_id'],
                    'specialization' => $validated['specialization'],
                    'license_number' => $validated['license_number'],
                    'gender' => $validated['gender'],
                    'date_of_birth' => $validated['date_of_birth'] ?? null,
                    'address' => $validated['address'] ?? null,
                    'status' => $validated['status'] ?? 'active',
                ]);
            });

            $doctor->load(['user', 'department']);

            return response()->json([
                'success' => true,
                'message' => 'Doctor updated successfully',
                'data' => $doctor
            ], 200);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to update doctor',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * DELETE /api/doctors/{id}
     */
    public function destroy($id)
    {
        try {

            $doctor = Doctor::with('user')->findOrFail($id);

            $hasDependencies = $doctor->appointments()->exists()
                || $doctor->medicalRecords()->exists()
                || $doctor->prescriptions()->exists();

            if ($hasDependencies) {
                return response()->json([
                    'success' => false,
                    'message' => 'This doctor cannot be deleted because records already reference them. Mark the doctor inactive instead.',
                ], 422);
            }

            DB::transaction(function () use ($doctor) {

                $user = $doctor->user;

                $doctor->delete();

                if ($user) {
                    $user->delete();
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Doctor deleted successfully'
            ], 200);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete doctor',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
