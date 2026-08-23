<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Email OTP Login
    |--------------------------------------------------------------------------
    |
    | ttl_minutes          how long a code stays valid
    | max_attempts         wrong-code tries allowed before the code is dead
    | resend_after_seconds minimum gap between two codes for the same email
    | debug                when true (non-production), the API response also
    |                      carries the code so you can log in locally without
    |                      configuring a real mail server / app password
    |
    */

    'ttl_minutes' => env('OTP_TTL_MINUTES', 10),

    'max_attempts' => env('OTP_MAX_ATTEMPTS', 5),

    'resend_after_seconds' => env('OTP_RESEND_AFTER_SECONDS', 60),

    'debug' => env('OTP_DEBUG', env('APP_ENV') !== 'production'),
];
