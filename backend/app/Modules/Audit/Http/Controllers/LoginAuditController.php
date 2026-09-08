<?php

namespace App\Modules\Audit\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Audit\Application\Services\LoginAuditService;
use App\Modules\Audit\Persistence\Models\UserLoginAudit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LoginAuditController extends Controller
{
    public function __construct(
        protected LoginAuditService $loginAuditService
    ) {}

    /**
     * Paginated login audit records with advanced filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = UserLoginAudit::with(['user.employee.branch', 'user.roles'])->latest('id');

        // Filter: Status (SUCCESS, FAILED, BLOCKED, SUSPICIOUS)
        if ($request->filled('status') && $request->status !== 'ALL') {
            if ($request->status === 'SUSPICIOUS') {
                $query->where(function ($q) {
                    $q->where('status', 'SUSPICIOUS')->orWhere('is_suspicious', true);
                });
            } else {
                $query->where('status', $request->status);
            }
        }

        // Filter: Event Type (LOGIN, LOGOUT, etc.)
        if ($request->filled('event_type') && $request->event_type !== 'ALL') {
            $query->where('event_type', $request->event_type);
        }

        // Filter: Device Type (DESKTOP, MOBILE, TABLET)
        if ($request->filled('device_type') && $request->device_type !== 'ALL') {
            $query->where('device_type', $request->device_type);
        }

        // Filter: Auth Method (PASSWORD, PIN, OTP, GOOGLE)
        if ($request->filled('auth_method') && $request->auth_method !== 'ALL') {
            $query->where('authentication_method', $request->auth_method);
        }

        // Filter: Suspicious Only
        if ($request->boolean('suspicious_only')) {
            $query->where(function ($q) {
                $q->where('is_suspicious', true)->orWhere('status', 'SUSPICIOUS');
            });
        }

        // Filter: Active Sessions Only
        if ($request->boolean('active_sessions_only')) {
            $query->activeSessions();
        }

        // Filter: Date Range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Search: Username, IP, Browser, Failure reason
        if ($request->filled('search')) {
            $s = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('username', 'LIKE', $s)
                  ->orWhere('ip_address', 'LIKE', $s)
                  ->orWhere('browser', 'LIKE', $s)
                  ->orWhere('operating_system', 'LIKE', $s)
                  ->orWhere('failure_reason', 'LIKE', $s)
                  ->orWhereHas('user', function ($uq) use ($s) {
                      $uq->where('username', 'LIKE', $s)
                         ->orWhere('email', 'LIKE', $s);
                  });
            });
        }

        $perPage = $request->integer('per_page', 25);
        $audits = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $audits->items(),
            'pagination' => [
                'total' => $audits->total(),
                'current_page' => $audits->currentPage(),
                'last_page' => $audits->lastPage(),
                'per_page' => $audits->perPage(),
            ],
        ]);
    }

    /**
     * Summary statistics for authentication monitoring dashboard.
     */
    public function stats(): JsonResponse
    {
        $today = now()->startOfDay();

        $totalLogins = UserLoginAudit::where('event_type', 'LOGIN')->count();
        $successfulLogins = UserLoginAudit::where('event_type', 'LOGIN')->where('status', 'SUCCESS')->count();
        $failedAttempts = UserLoginAudit::where('status', 'FAILED')->count();
        $suspiciousLogins = UserLoginAudit::where(function ($q) {
            $q->where('is_suspicious', true)->orWhere('status', 'SUSPICIOUS');
        })->count();

        // Active sessions within 24h that haven't explicitly logged out
        $activeSessionsCount = UserLoginAudit::activeSessions()->count();

        // Logins today
        $todayTotal = UserLoginAudit::where('event_type', 'LOGIN')->where('created_at', '>=', $today)->count();
        $todayFailed = UserLoginAudit::where('status', 'FAILED')->where('created_at', '>=', $today)->count();

        $successRate = $totalLogins > 0 ? round(($successfulLogins / $totalLogins) * 100, 1) : 100;

        return response()->json([
            'success' => true,
            'data' => [
                'total_logins' => $totalLogins,
                'successful_logins' => $successfulLogins,
                'failed_attempts' => $failedAttempts,
                'suspicious_logins' => $suspiciousLogins,
                'active_sessions' => $activeSessionsCount,
                'success_rate' => $successRate,
                'today_total' => $todayTotal,
                'today_failed' => $todayFailed,
            ],
        ]);
    }

    /**
     * Active user sessions list.
     */
    public function activeSessions(): JsonResponse
    {
        $sessions = UserLoginAudit::with(['user.employee.branch', 'user.roles'])
            ->activeSessions()
            ->latest('login_at')
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $sessions,
        ]);
    }

    /**
     * Administrative Force Logout of a session.
     */
    public function forceLogout(Request $request, int $id): JsonResponse
    {
        $adminUser = $request->user();
        $success = $this->loginAuditService->forceLogout($id, $adminUser?->id ?? 1);

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'Login audit record or session not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'User session has been forcefully terminated.',
        ]);
    }

    /**
     * Export login audit records to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $query = UserLoginAudit::latest('id');

        if ($request->filled('status') && $request->status !== 'ALL') {
            $query->where('status', $request->status);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $records = $query->limit(2000)->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="user_login_audits_' . date('Y-m-d_His') . '.csv"',
        ];

        return response()->stream(function () use ($records) {
            $handle = fopen('php://output', 'w');
            // UTF-8 BOM
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // Header row
            fputcsv($handle, [
                'ID',
                'Username',
                'Event Type',
                'Status',
                'IP Address',
                'Device Type',
                'Browser',
                'Operating System',
                'Country',
                'City',
                'Auth Method',
                'Failure Reason',
                'Suspicious Flag',
                'Login Time',
                'Logout Time',
                'Logout Reason',
                'Created At'
            ]);

            foreach ($records as $r) {
                fputcsv($handle, [
                    $r->id,
                    $r->username,
                    $r->event_type,
                    $r->status,
                    $r->ip_address,
                    $r->device_type,
                    $r->browser,
                    $r->operating_system,
                    $r->country,
                    $r->city,
                    $r->authentication_method,
                    $r->failure_reason,
                    $r->is_suspicious ? 'YES' : 'NO',
                    $r->login_at?->toDateTimeString(),
                    $r->logout_at?->toDateTimeString(),
                    $r->logout_reason,
                    $r->created_at?->toDateTimeString()
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
