<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Modules\Authentication\Persistence\Models\AuthSession;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Auth::viaRequest('auth_session', function (Request $request) {
            $token = $request->bearerToken();
            if (!$token) {
                return null;
            }

            $tokenHash = hash('sha256', $token);
            $session = AuthSession::with(['user.employee', 'user.roles.permissions', 'user.socialAccounts'])
                ->where('token_hash', $tokenHash)
                ->where('is_revoked', false)
                ->where(function ($query) {
                    $query->whereNull('expires_at')
                        ->orWhere('expires_at', '>', now());
                })
                ->first();

            if ($session && $session->user) {
                try {
                    $session->update(['last_activity_at' => now()]);
                } catch (\Throwable $e) {
                    // Ignore activity touch errors during concurrent read-only queries
                }
                return $session->user;
            }

            return null;
        });
    }
}
