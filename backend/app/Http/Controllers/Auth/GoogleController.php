<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleController extends Controller
{
    public function redirect()
    {
        /** @var \Laravel\Socialite\Two\AbstractProvider $driver */
        $driver = Socialite::driver('google');

        return $driver->stateless()->redirect();
    }

    public function callback()
    {
        try {
            /** @var \Laravel\Socialite\Two\AbstractProvider $driver */
            $driver = Socialite::driver('google');

            $googleUser = $driver->stateless()->user();
        } catch (Throwable $e) {
            return redirect()->away($this->frontendUrl('/login?error=google'));
        }

        $user = User::where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        if (!$user) {
            $user = User::create([
                'name'              => $googleUser->getName(),
                'email'             => $googleUser->getEmail(),
                'google_id'         => $googleUser->getId(),
                'avatar'            => $googleUser->getAvatar(),
                'password'          => bcrypt(Str::random(16)),
                'email_verified_at' => now(),
                'role_id'           => Role::where('name', 'Receptionist')->value('id') ?? 3,
                'status'            => 'active',
            ]);
        } else {
            if ($user->status !== 'active') {
                return redirect()->away($this->frontendUrl('/login?error=inactive'));
            }

            $user->update([
                'google_id' => $googleUser->getId(),
                'avatar'    => $googleUser->getAvatar(),
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return redirect()->away($this->frontendUrl('/auth/callback?token=' . $token));
    }

    private function frontendUrl(string $path): string
    {
        return rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') . $path;
    }
}
