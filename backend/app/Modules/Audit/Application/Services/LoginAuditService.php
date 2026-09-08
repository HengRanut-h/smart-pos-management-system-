<?php

namespace App\Modules\Audit\Application\Services;

use App\Modules\Audit\Persistence\Models\UserLoginAudit;
use App\Modules\Authentication\Persistence\Models\AuthSession;
use App\Modules\User\Persistence\Models\User;
use Illuminate\Http\Request;

class LoginAuditService
{
    /**
     * Record a successful authentication attempt.
     */
    public function recordLoginSuccess(
        User $user,
        Request $request,
        string $authMethod = 'PASSWORD',
        ?string $sessionId = null,
        bool $rememberMe = false,
        bool $twoFactorVerified = false
    ): UserLoginAudit {
        $parsed = $this->parseUserAgent($request->userAgent() ?? '');
        $ip = $request->ip() ?? '127.0.0.1';

        $isSuspicious = $this->evaluateSuspicion($ip, $user->username);

        return UserLoginAudit::create([
            'user_id' => $user->id,
            'username' => $user->username,
            'session_id' => $sessionId,
            'event_type' => 'LOGIN',
            'status' => $isSuspicious ? 'SUSPICIOUS' : 'SUCCESS',
            'ip_address' => $ip,
            'user_agent' => $request->userAgent(),
            'device_type' => $parsed['device_type'],
            'browser' => $parsed['browser'],
            'operating_system' => $parsed['os'],
            'country' => 'Cambodia',
            'city' => 'Phnom Penh',
            'authentication_method' => strtoupper($authMethod),
            'failure_reason' => null,
            'is_suspicious' => $isSuspicious,
            'remember_me' => $rememberMe,
            'two_factor_verified' => $twoFactorVerified,
            'login_at' => now(),
            'last_activity_at' => now(),
        ]);
    }

    /**
     * Record a failed authentication attempt.
     */
    public function recordLoginFailed(
        string $username,
        Request $request,
        string $failureReason = 'Invalid credentials',
        string $authMethod = 'PASSWORD'
    ): UserLoginAudit {
        $parsed = $this->parseUserAgent($request->userAgent() ?? '');
        $ip = $request->ip() ?? '127.0.0.1';

        // Check user existence if available
        $user = User::where('username', $username)
            ->orWhere('email', $username)
            ->orWhere('phone', $username)
            ->first();

        // Evaluate if velocity indicates brute force
        $recentFailed = UserLoginAudit::where('ip_address', $ip)
            ->where('status', 'FAILED')
            ->where('created_at', '>=', now()->subMinutes(15))
            ->count();

        $isSuspicious = ($recentFailed >= 3);
        $status = $isSuspicious ? 'SUSPICIOUS' : 'FAILED';

        return UserLoginAudit::create([
            'user_id' => $user?->id,
            'username' => $username,
            'session_id' => null,
            'event_type' => 'LOGIN',
            'status' => $status,
            'ip_address' => $ip,
            'user_agent' => $request->userAgent(),
            'device_type' => $parsed['device_type'],
            'browser' => $parsed['browser'],
            'operating_system' => $parsed['os'],
            'country' => 'Cambodia',
            'city' => 'Phnom Penh',
            'authentication_method' => strtoupper($authMethod),
            'failure_reason' => $failureReason,
            'is_suspicious' => $isSuspicious,
            'remember_me' => false,
            'two_factor_verified' => false,
            'login_at' => null,
            'last_activity_at' => now(),
        ]);
    }

    /**
     * Record user logout event.
     */
    public function recordLogout(?User $user, ?string $sessionId = null, string $reason = 'MANUAL'): void
    {
        if ($sessionId) {
            $audit = UserLoginAudit::where('session_id', $sessionId)->latest()->first();
            if ($audit) {
                $audit->update([
                    'logout_at' => now(),
                    'logout_reason' => $reason,
                    'event_type' => 'LOGOUT',
                ]);
                return;
            }
        }

        if ($user) {
            $audit = UserLoginAudit::where('user_id', $user->id)
                ->whereNull('logout_at')
                ->latest()
                ->first();

            if ($audit) {
                $audit->update([
                    'logout_at' => now(),
                    'logout_reason' => $reason,
                    'event_type' => 'LOGOUT',
                ]);
            }
        }
    }

    /**
     * Terminate an active session and mark audit record as forced by admin.
     */
    public function forceLogout(int $auditId, int $adminUserId): bool
    {
        $audit = UserLoginAudit::find($auditId);
        if (!$audit) {
            return false;
        }

        // Revoke the corresponding AuthSession if session_id is recorded
        if ($audit->session_id) {
            AuthSession::where('id', $audit->session_id)->update(['is_revoked' => true]);
        } elseif ($audit->user_id) {
            AuthSession::where('user_id', $audit->user_id)->update(['is_revoked' => true]);
        }

        $audit->update([
            'logout_at' => now(),
            'logout_reason' => 'ADMIN_FORCED',
            'event_type' => 'LOGOUT',
        ]);

        return true;
    }

    /**
     * Parse User-Agent string to detect device type, browser, and OS.
     */
    public function parseUserAgent(string $ua): array
    {
        $deviceType = 'DESKTOP';
        $browser = 'Other';
        $os = 'Unknown';

        // Detect device type
        if (preg_match('/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i', $ua)) {
            $deviceType = 'TABLET';
        } elseif (preg_match('/(iphone|ipod|blackberry|android|mobile|opera mini|iemobile)/i', $ua)) {
            $deviceType = 'MOBILE';
        }

        // Detect OS
        if (preg_match('/windows nt 10/i', $ua)) {
            $os = 'Windows 10/11';
        } elseif (preg_match('/windows nt/i', $ua)) {
            $os = 'Windows';
        } elseif (preg_match('/macintosh|mac os x/i', $ua)) {
            $os = 'macOS';
        } elseif (preg_match('/android/i', $ua)) {
            $os = 'Android';
        } elseif (preg_match('/iphone|ipad|ipod/i', $ua)) {
            $os = 'iOS';
        } elseif (preg_match('/linux/i', $ua)) {
            $os = 'Linux';
        }

        // Detect Browser
        if (preg_match('/edg/i', $ua)) {
            $browser = 'Edge';
        } elseif (preg_match('/chrome|crios/i', $ua)) {
            $browser = 'Chrome';
        } elseif (preg_match('/firefox|fxios/i', $ua)) {
            $browser = 'Firefox';
        } elseif (preg_match('/safari/i', $ua) && !preg_match('/chrome/i', $ua)) {
            $browser = 'Safari';
        } elseif (preg_match('/msie|trident/i', $ua)) {
            $browser = 'Internet Explorer';
        }

        return [
            'device_type' => $deviceType,
            'browser' => $browser,
            'os' => $os,
        ];
    }

    /**
     * Check if the attempt looks suspicious (e.g. repeated failures).
     */
    protected function evaluateSuspicion(string $ip, string $username): bool
    {
        $failedCount = UserLoginAudit::where('ip_address', $ip)
            ->where('status', 'FAILED')
            ->where('created_at', '>=', now()->subMinutes(15))
            ->count();

        return $failedCount >= 5;
    }
}
