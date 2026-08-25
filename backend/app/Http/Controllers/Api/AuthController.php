<?php

// namespace App\Http\Controllers\Api;
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // POST /api/login
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::with('role')
            ->where('email', $request->email)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        // Check account status
        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Your account is currently inactive.'
            ], 403);
        }

        // Create Sanctum token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'access_token' => $token,
            'token_type' => 'Bearer',

            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar_url' => $user->avatar_url,
                'profile_picture' => $user->profile_picture,
                'role' => $user->role
                    ? $user->role->name
                    : null,
            ]
        ], 200);
    }


    // GET /api/me
    public function me(Request $request)
    {
        $user = User::with('role')->find($request->user()->id);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar_url' => $user->avatar_url,
                'profile_picture' => $user->profile_picture,
                'role' => $user->role
                    ? $user->role->name
                    : null,
            ]
        ], 200);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:30',
            'profile_picture' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('profile_picture')) {
            if ($user->profile_picture) {
                Storage::disk('public')->delete($user->profile_picture);
            }

            $validated['profile_picture'] = $request->file('profile_picture')->store('profile-pictures', 'public');
        }

        $user->update($validated);
        $user->load('role');

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar_url' => $user->avatar_url,
                'profile_picture' => $user->profile_picture,
                'role' => $user->role ? $user->role->name : null,
            ],
        ], 200);
    }

    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
                'errors' => [
                    'current_password' => ['Current password is incorrect.'],
                ],
            ], 422);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'Password changed successfully.',
        ], 200);
    }

    public function deleteAccount(Request $request)
    {
        $user = $request->user()->load('doctor');

        $rules = [
            'confirmation_email' => 'required|email',
        ];

        if ($user->password) {
            $rules['password'] = 'required|string';
        }

        $validated = $request->validate($rules);

        if (strtolower($validated['confirmation_email']) !== strtolower($user->email)) {
            return response()->json([
                'message' => 'Type your account email to confirm this action.',
                'errors' => [
                    'confirmation_email' => ['Type your account email to confirm this action.'],
                ],
            ], 422);
        }

        if ($user->password && !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
                'errors' => [
                    'password' => ['Current password is incorrect.'],
                ],
            ], 422);
        }

        $wasDeactivated = false;

        DB::transaction(function () use ($user, &$wasDeactivated) {
            $doctor = $user->doctor;
            $hasClinicalHistory = $doctor && (
                $doctor->appointments()->exists()
                || $doctor->medicalRecords()->exists()
                || $doctor->prescriptions()->exists()
            );

            $user->tokens()->delete();

            if ($hasClinicalHistory) {
                $user->update(['status' => 'inactive']);
                $doctor->update(['status' => 'inactive']);
                $wasDeactivated = true;
                return;
            }

            if ($user->profile_picture) {
                Storage::disk('public')->delete($user->profile_picture);
            }

            $user->delete();
        });

        return response()->json([
            'message' => $wasDeactivated
                ? 'Your account has clinical history, so it was deactivated instead of deleted.'
                : 'Your account has been deleted.',
            'deactivated' => $wasDeactivated,
        ], 200);
    }


    // POST /api/logout
    public function logout(Request $request)
    {
        $request->user()
            ->currentAccessToken()
            ->delete();

        return response()->json([
            'message' => 'Logged out successfully.'
        ], 200);
    }
}
