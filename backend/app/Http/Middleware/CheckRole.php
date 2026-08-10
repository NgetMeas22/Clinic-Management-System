<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$roles
     * @return mixed
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (!$user || !$user->role || !in_array($user->role->name, $roles)) {
            return response()->json([
                "message" => "You don't have access to this page (Unauthorized)"
            ], 403);
        }

        return $next($request);
    }
}
