<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OtpMail;
use App\Models\EmailOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Throwable;

class OtpController extends Controller
{
    // POST /api/auth/otp/request
    public function requestCode(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = strtolower(trim($request->input('email')));

        if (!Cache::add("otp-resend:{$email}", true, (int) config('otp.resend_after_seconds'))) {
            return response()->json([
                'message' => 'A code was just sent. Please wait a minute before requesting another one.',
            ], 429);
        }

        $user = User::where('email', $request->input('email'))->first();

        if (!$user) {
            return response()->json([
                'message' => 'No account found with this email.',
            ], 404);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Your account is currently inactive.',
            ], 403);
        }

        $code = (string) random_int(100000, 999999);

        EmailOtp::where('email', $user->email)->delete();

        EmailOtp::create([
            'email' => $user->email,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes((int) config('otp.ttl_minutes')),
        ]);

        try {
            Mail::to($user->email)->send(new OtpMail(
                $user->name,
                $code,
                (int) config('otp.ttl_minutes'),
            ));
        } catch (Throwable $e) {
            report($e);

            if (!config('otp.debug')) {
                return response()->json([
                    'message' => 'Failed to send the code. Please try again.',
                ], 500);
            }
        }

        return response()->json(array_filter([
            'message' => 'We emailed you a 6-digit login code.',
            'debug_code' => config('otp.debug') ? $code : null,
        ]));
    }

    // POST /api/auth/otp/verify
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|digits:6',
        ]);

        $otp = EmailOtp::where('email', $request->input('email'))
            ->latest('id')
            ->first();

        if (!$otp || !$otp->isValid()) {
            return response()->json([
                'message' => 'This code has expired. Please request a new one.',
            ], 422);
        }

        if ($otp->attempts >= (int) config('otp.max_attempts')) {
            return response()->json([
                'message' => 'Too many wrong attempts. Please request a new code.',
            ], 422);
        }

        $otp->increment('attempts');

        if (!Hash::check($request->input('code'), $otp->code_hash)) {
            return response()->json([
                'message' => 'Invalid code.',
                'attempts_left' => max(0, (int) config('otp.max_attempts') - $otp->attempts),
            ], 422);
        }

        $otp->update(['consumed_at' => now()]);
        EmailOtp::where('email', $otp->email)->whereNull('consumed_at')->delete();
        Cache::forget('otp-resend:' . strtolower(trim($request->input('email'))));

        $user = User::with('role')
            ->where('email', $request->input('email'))
            ->first();

        if (!$user || $user->status !== 'active') {
            return response()->json([
                'message' => 'Your account is currently inactive.',
            ], 403);
        }

        $token = $user->createToken('otp_login')->plainTextToken;

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
                'role' => $user->role ? $user->role->name : null,
            ],
        ], 200);
    }
}
