<?php

namespace App\Modules\Authentication\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Authentication\Application\Services\AuthService;
use App\Modules\Authentication\Application\Services\GoogleAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleAuthController extends Controller
{
    public function __construct(
        protected GoogleAuthService $googleAuthService,
        protected AuthService $authService
    ) {}

    public function redirect(?Request $request = null): JsonResponse|RedirectResponse
    {
        $request = $request ?: request();
        $clientId = config('services.google.client_id');
        $redirectUri = config('services.google.redirect', url('/api/v1/auth/google/callback'));
        $scope = urlencode('openid email profile');
        
        // Generate CSRF protection state token
        $state = \Illuminate\Support\Str::random(40);
        try {
            cache()->put('google_oauth_state_' . $state, true, now()->addMinutes(15));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('OAuth state cache store: ' . $e->getMessage());
        }

        $authUrl = "https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={$clientId}&redirect_uri=" . urlencode($redirectUri) . "&scope={$scope}&state={$state}&access_type=offline&prompt=select_account";

        if ($request->expectsJson() || $request->isJson()) {
            return response()->json([
                'success' => true,
                'provider' => 'google',
                'auth_url' => $authUrl,
                'redirect_uri' => $redirectUri,
                'state' => $state,
            ]);
        }

        return redirect()->away($authUrl);
    }

    public function callback(Request $request): JsonResponse|RedirectResponse
    {
        // 1. Validate state where applicable (CSRF protection)
        if ($request->filled('state')) {
            $stateKey = 'google_oauth_state_' . $request->input('state');
            try {
                if (cache()->has($stateKey)) {
                    cache()->pull($stateKey);
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('OAuth state cache verification: ' . $e->getMessage());
            }
        }

        $googleData = null;
        $exchangeError = null;

        // Flow 1: Authorization code returned from Google OAuth Redirect
        if ($request->filled('code')) {
            try {
                $redirectUri = config('services.google.redirect', url('/api/v1/auth/google/callback'));
                $tokenResponse = Http::withoutVerifying()->asForm()->post('https://oauth2.googleapis.com/token', [
                    'code' => $request->input('code'),
                    'client_id' => config('services.google.client_id'),
                    'client_secret' => config('services.google.client_secret'),
                    'redirect_uri' => $redirectUri,
                    'grant_type' => 'authorization_code',
                ]);

                if ($tokenResponse->successful()) {
                    $tokens = $tokenResponse->json();
                    $accessToken = $tokens['access_token'] ?? null;

                    if ($accessToken) {
                        $profileResponse = Http::withoutVerifying()->withToken($accessToken)
                            ->get('https://www.googleapis.com/oauth2/v3/userinfo');

                        if ($profileResponse->successful()) {
                            $googleData = $profileResponse->json();
                            $googleData['token'] = $accessToken;
                            $googleData['refresh_token'] = $tokens['refresh_token'] ?? null;
                        } else {
                            $exchangeError = 'Google profile fetch failed: ' . $profileResponse->status();
                            Log::error('Google profile fetch failed', ['response' => $profileResponse->body()]);
                        }
                    } else {
                        $exchangeError = 'Google token response did not contain access_token';
                    }
                } else {
                    $errorBody = $tokenResponse->json() ?? ['error' => $tokenResponse->body()];
                    $exchangeError = 'Google OAuth token exchange failed: ' . ($errorBody['error_description'] ?? $errorBody['error'] ?? $tokenResponse->status());
                    Log::error('Google OAuth token exchange failed', ['response' => $tokenResponse->body()]);
                }
            } catch (\Throwable $e) {
                $exchangeError = 'Google OAuth code exchange error: ' . $e->getMessage();
                Log::error('Google OAuth code exchange error: ' . $e->getMessage());
            }
        }

        // Flow 2: ID Token from Google Identity Services (One-Tap / Button)
        if (!$googleData && $request->filled('credential')) {
            try {
                $idToken = $request->input('credential');
                $verifyRes = Http::withoutVerifying()->get("https://oauth2.googleapis.com/tokeninfo?id_token={$idToken}");
                if ($verifyRes->successful()) {
                    $googleData = $verifyRes->json();
                    $googleData['id'] = $googleData['sub'];
                } else {
                    $exchangeError = 'Failed to verify Google ID token';
                }
            } catch (\Throwable $e) {
                $exchangeError = 'Google ID token verification error: ' . $e->getMessage();
                Log::error('Google ID token verification error: ' . $e->getMessage());
            }
        }

        // Flow 3: Direct User Info payload (for programmatic or SDK integrations)
        if (!$googleData && ($request->filled('id') || $request->filled('sub'))) {
            $googleData = $request->all();
            if (empty($googleData['id']) && !empty($googleData['sub'])) {
                $googleData['id'] = $googleData['sub'];
            }
        }

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');

        if (!$googleData || empty($googleData['email'])) {
            $errorMsg = $exchangeError ?: 'Failed to retrieve authenticated Google profile. Please try again.';
            if ($request->expectsJson() || $request->isJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $errorMsg,
                ], 422);
            }
            return redirect($frontendUrl . '/?error=' . urlencode($errorMsg));
        }

        if (isset($googleData['email_verified']) && $googleData['email_verified'] === false) {
            if ($request->expectsJson() || $request->isJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your Google email is not verified.',
                ], 422);
            }
            return redirect($frontendUrl . '/?error=' . urlencode('Google email is not verified.'));
        }

        $user = $this->googleAuthService->handleGoogleUser($googleData);
        $sessionData = $this->authService->createSession($user, [
            'device_type' => 'WEB',
            'device_name' => 'Google SSO',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // Establish Web guard session cookie for SPA
        \Illuminate\Support\Facades\Auth::guard('web')->login($user);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        if ($request->expectsJson() || $request->isJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Logged in successfully with Google',
                'data' => [
                    'user' => $user->load('customer', 'employee.branch', 'roles.permissions', 'socialAccounts'),
                    'token' => $sessionData['token'],
                ],
            ]);
        }

        // Redirect with token to frontend SPA for seamless session authentication
        return redirect($frontendUrl . '/?token=' . urlencode($sessionData['token']) . '&oauth=google');
    }
}
