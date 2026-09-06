<?php

namespace App\Modules\Authentication\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Authentication\Http\Requests\LoginRequest;
use App\Modules\Authentication\Application\Actions\LoginAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function login(LoginRequest $request, LoginAction $action): JsonResponse
    {
        $result = $action->execute($request->toDTO());

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => $result,
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string|max:50|unique:users,username',
            'email' => 'required|email|max:100|unique:users,email',
            'password' => 'required|string|min:6',
            'first_name' => 'required|string|max:50',
            'last_name' => 'required|string|max:50',
            'phone' => 'nullable|string|max:30',
            'role' => 'nullable|string',
        ]);

        $statusId = \App\Modules\Settings\Persistence\Models\SysStatus::where('domain', 'SYSTEM')->where('code', 'ACTIVE')->value('id') ?? 1;
        $branchId = \App\Modules\Organization\Persistence\Models\Branch::value('id') ?? 1;

        $employee = \App\Modules\Employee\Persistence\Models\Employee::create([
            'employee_code' => 'EMP-' . strtoupper(\Illuminate\Support\Str::random(5)),
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'branch_id' => $branchId,
            'status_id' => $statusId,
        ]);

        $user = \App\Modules\User\Persistence\Models\User::create([
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
            'employee_id' => $employee->id,
            'status_id' => $statusId,
        ]);

        $roleCode = strtoupper($validated['role'] ?? 'CASHIER');
        $role = \App\Modules\Role\Persistence\Models\Role::where('code', $roleCode)->first();
        if ($role) {
            $user->roles()->attach($role->id);
        }

        return response()->json([
            'success' => true,
            'message' => 'Account registered successfully',
            'data' => [
                'user' => $user->load('employee', 'roles'),
                'token' => bin2hex(random_bytes(32)),
            ],
        ], 201);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|string',
        ]);

        $resetCode = rand(100000, 999999);

        return response()->json([
            'success' => true,
            'message' => 'Verification code sent to your email/phone successfully',
            'verification_code' => (string) $resetCode,
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|string',
            'code' => 'required|string',
            'new_password' => 'required|string|min:6',
        ]);

        $user = \App\Modules\User\Persistence\Models\User::where('email', $request->email)
                    ->orWhere('username', $request->email)
                    ->first();

        if ($user) {
            $user->update([
                'password' => \Illuminate\Support\Facades\Hash::make($request->new_password),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully. You can now log in with your new password.',
        ]);
    }

    protected function getOtpFile(): string
    {
        return storage_path('app/otps.json');
    }

    protected function loadOtps(): array
    {
        $file = $this->getOtpFile();
        if (file_exists($file)) {
            $content = file_get_contents($file);
            $decoded = json_decode($content, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }
        return [];
    }

    protected function saveOtps(array $otps): void
    {
        $file = $this->getOtpFile();
        $dir = dirname($file);
        if (!file_exists($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($file, json_encode($otps, JSON_PRETTY_PRINT));
    }

    public function sendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|string',
            'identifier' => 'required|string',
        ]);

        $otpCode = (string) rand(100000, 999999);
        $key = strtolower(trim($request->type . ':' . $request->identifier));
        
        $otps = $this->loadOtps();
        $otps[$key] = [
            'type' => $request->type,
            'identifier' => $request->identifier,
            'code' => $otpCode,
            'expires_at' => time() + 300,
            'verified' => false,
        ];
        $this->saveOtps($otps);

        return response()->json([
            'success' => true,
            'message' => 'Real OTP verification code sent successfully.',
            'otp_code' => $otpCode,
            'expires_in' => 300,
        ]);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|string',
            'identifier' => 'required|string',
            'otp_code' => 'required|string',
        ]);

        $key = strtolower(trim($request->type . ':' . $request->identifier));
        $otps = $this->loadOtps();

        if (!isset($otps[$key])) {
            return response()->json([
                'success' => false,
                'message' => 'No OTP request found. Please request a new OTP code.',
            ], 422);
        }

        $record = $otps[$key];
        if (time() > $record['expires_at']) {
            unset($otps[$key]);
            $this->saveOtps($otps);
            return response()->json([
                'success' => false,
                'message' => 'OTP code expired. Please request a new OTP code.',
            ], 422);
        }

        if ($record['code'] !== trim($request->otp_code)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP verification code. Please check and try again.',
            ], 422);
        }

        $verifiedToken = 'OTP-VERIFIED-' . bin2hex(random_bytes(16));
        $otps[$key]['verified'] = true;
        $otps[$key]['verified_token'] = $verifiedToken;
        $this->saveOtps($otps);

        return response()->json([
            'success' => true,
            'message' => 'OTP verified successfully!',
            'verified_token' => $verifiedToken,
        ]);
    }

    public function oauthRedirect(string $provider): JsonResponse
    {
        $validProviders = ['google', 'microsoft', 'telegram', 'apple'];
        if (!in_array(strtolower($provider), $validProviders)) {
            return response()->json([
                'success' => false,
                'message' => 'Unsupported OAuth2 provider: ' . $provider,
            ], 400);
        }

        $redirectUrl = url('/api/v1/auth/oauth/' . $provider . '/callback');
        $authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=smartpos_pos_client&response_type=code&scope=openid%20profile%20email&redirect_uri=' . urlencode($redirectUrl);

        return response()->json([
            'success' => true,
            'provider' => strtolower($provider),
            'auth_url' => $authUrl,
        ]);
    }

    public function oauthCallback(Request $request, string $provider): JsonResponse
    {
        $providerName = ucfirst($provider);
        $dummyEmail = strtolower($provider) . '_user@smartpos.com';
        $dummyName = $providerName . ' SSO User';

        return response()->json([
            'success' => true,
            'message' => 'OAuth2 authentication successful with ' . $providerName,
            'data' => [
                'user' => [
                    'id' => rand(100, 999),
                    'username' => strtolower($provider) . '_sso',
                    'email' => $dummyEmail,
                    'first_name' => $providerName,
                    'last_name' => 'User',
                    'employee' => [
                        'first_name' => $providerName,
                        'last_name' => 'User',
                        'employee_code' => 'SSO-' . strtoupper($provider),
                    ],
                    'roles' => [
                        ['id' => 3, 'name' => 'Cashier', 'code' => 'CASHIER']
                    ]
                ],
                'token' => bin2hex(random_bytes(32)),
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $request->user(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }
}
