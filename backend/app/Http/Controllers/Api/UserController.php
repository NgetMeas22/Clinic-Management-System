<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = User::with('role');

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($builder) use ($search) {
                    $builder->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            if ($request->filled('role')) {
                $query->whereHas('role', function ($builder) use ($request) {
                    $builder->where('name', $request->role);
                });
            }

            $users = $query->latest()->paginate(10);

            return response()->json([
                'success' => true,
                'message' => 'Users retrieved successfully',
                'data' => $users,
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve users',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(User $user)
    {
        try {
            $user->load('role');

            return response()->json([
                'success' => true,
                'message' => 'User retrieved successfully',
                'data' => $user,
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:100',
                'email' => 'required|email|max:150|unique:users,email',
                'phone' => 'nullable|string|max:30',
                'role' => 'required|in:Admin,Doctor,Receptionist',
                'password' => 'required|string|min:8',
                'status' => 'required|in:active,inactive',
            ]);

            $role = Role::where('name', $validated['role'])->firstOrFail();

            $user = User::create([
                'role_id' => $role->id,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make($validated['password']),
                'status' => $validated['status'],
            ]);

            $user->load('role');

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data' => $user,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, User $user)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:100',
                'email' => 'required|email|max:150|unique:users,email,' . $user->id,
                'phone' => 'nullable|string|max:30',
                'role' => 'required|in:Admin,Doctor,Receptionist',
                'password' => 'nullable|string|min:8',
                'status' => 'required|in:active,inactive',
            ]);

            $role = Role::where('name', $validated['role'])->firstOrFail();

            DB::transaction(function () use ($user, $validated, $role) {
                $payload = [
                    'role_id' => $role->id,
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'] ?? null,
                    'status' => $validated['status'],
                ];

                if (!empty($validated['password'])) {
                    $payload['password'] = Hash::make($validated['password']);
                }

                $user->update($payload);
            });

            $user->load('role');

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $user,
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, User $user)
    {
        try {
            if ($request->user()->id === $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot delete your own account.',
                ], 422);
            }

            // A user may be linked 1:1 to a doctor profile. Deleting the user
            // cascades to the doctor, but doctors referenced by appointments,
            // records or prescriptions are protected by FK constraints.
            $doctor = $user->doctor;
            if ($doctor) {
                $hasDependencies = $doctor->appointments()->exists()
                    || $doctor->medicalRecords()->exists()
                    || $doctor->prescriptions()->exists();

                if ($hasDependencies) {
                    return response()->json([
                        'success' => false,
                        'message' => 'This user is a doctor with patient records and cannot be deleted. Mark the account inactive instead.',
                    ], 422);
                }
            }

            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully',
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
