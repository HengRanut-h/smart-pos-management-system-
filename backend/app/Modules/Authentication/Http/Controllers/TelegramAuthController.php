<?php

namespace App\Modules\Authentication\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Authentication\Application\Services\AuthService;
use App\Modules\Authentication\Application\Services\TelegramAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TelegramAuthController extends Controller
{
    public function __construct(
        protected TelegramAuthService $telegramAuthService,
        protected AuthService $authService
    ) {}

    public function botInfo(): JsonResponse
    {
        $botUsername = config('services.telegram.bot_username', env('TELEGRAM_BOT_USERNAME', 'SmartPOS_AuthBot'));

        return response()->json([
            'success' => true,
            'bot_username' => $botUsername,
            'auth_url' => "https://oauth.telegram.org/auth?bot_id={$botUsername}&origin=" . urlencode(url('/')),
        ]);
    }

    public function callback(Request $request): JsonResponse|RedirectResponse
    {
        $data = $request->all();

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');

        if (empty($data['id'])) {
            if ($request->expectsJson() || $request->isJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid Telegram user payload.',
                ], 422);
            }
            return redirect($frontendUrl . '/?error=' . urlencode('Invalid Telegram authentication payload.'));
        }

        // Validate cryptographic signature using Telegram Bot Token if set
        $botToken = config('services.telegram.bot_token', env('TELEGRAM_BOT_TOKEN'));
        if ($botToken && !empty($data['hash'])) {
            $valid = $this->telegramAuthService->verifyTelegramData($data, $botToken);
            if (!$valid) {
                if ($request->expectsJson() || $request->isJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid Telegram authentication signature.',
                    ], 403);
                }
                return redirect($frontendUrl . '/?error=' . urlencode('Telegram signature verification failed.'));
            }
        }

        $user = $this->telegramAuthService->handleTelegramUser($data);
        $sessionData = $this->authService->createSession($user, [
            'device_type' => 'WEB',
            'device_name' => 'Telegram SSO',
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
                'message' => 'Logged in successfully with Telegram',
                'data' => [
                    'user' => $user->load('employee', 'roles.permissions', 'socialAccounts'),
                    'token' => $sessionData['token'],
                ],
            ]);
        }

        return redirect($frontendUrl . '/?token=' . urlencode($sessionData['token']) . '&oauth=telegram');
    }
}
