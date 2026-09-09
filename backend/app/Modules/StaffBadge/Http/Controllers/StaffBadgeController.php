<?php

namespace App\Modules\StaffBadge\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Modules\StaffBadge\Persistence\Models\StaffBadgeTemplate;
use App\Modules\StaffBadge\Persistence\Models\StaffBadgeTemplateVersion;
use App\Modules\StaffBadge\Persistence\Models\StaffBadge;
use App\Modules\StaffBadge\Persistence\Models\StaffBadgeScanLog;
use App\Modules\StaffBadge\Persistence\Models\StaffBadgeAuditLog;
use App\Modules\Employee\Persistence\Models\Employee;

class StaffBadgeController extends Controller
{
    // =========================================================================
    // TEMPLATES
    // =========================================================================
    public function templates()
    {
        $templates = StaffBadgeTemplate::withCount(['badges', 'versions'])
            ->with('branch:id,name,code')
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $templates]);
    }

    public function saveTemplate(Request $request, $id = null)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'code' => 'required|string|max:80',
            'badge_type' => 'nullable|string',
            'orientation' => 'nullable|string',
            'card_size' => 'nullable|string',
            'width_mm' => 'nullable|numeric',
            'height_mm' => 'nullable|numeric',
            'front_design' => 'required|array',
            'back_design' => 'nullable|array',
            'is_default' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'branch_id' => 'nullable|integer',
            'change_summary' => 'nullable|string',
        ]);

        if (!empty($validated['is_default'])) {
            StaffBadgeTemplate::where('is_default', true)->update(['is_default' => false]);
        }

        if ($id) {
            $template = StaffBadgeTemplate::findOrFail($id);
            $template->update($validated);
        } else {
            $template = StaffBadgeTemplate::create($validated);
        }

        // Record template version
        $lastVersion = StaffBadgeTemplateVersion::where('template_id', $template->id)->max('version_number') ?? 0;
        StaffBadgeTemplateVersion::create([
            'template_id' => $template->id,
            'version_number' => $lastVersion + 1,
            'change_summary' => $request->input('change_summary', $id ? 'Updated badge layout & styling' : 'Initial template creation'),
            'front_design' => $template->front_design,
            'back_design' => $template->back_design,
            'created_by' => auth()->id() ?? 1,
        ]);

        return response()->json([
            'message' => 'Badge template saved successfully',
            'data' => $template->loadCount(['badges', 'versions']),
        ]);
    }

    public function templateVersions($id)
    {
        $versions = StaffBadgeTemplateVersion::where('template_id', $id)
            ->orderByDesc('version_number')
            ->get();

        return response()->json(['data' => $versions]);
    }

    public function restoreTemplateVersion($templateId, $versionId)
    {
        $template = StaffBadgeTemplate::findOrFail($templateId);
        $version = StaffBadgeTemplateVersion::where('template_id', $templateId)->where('id', $versionId)->firstOrFail();

        $template->update([
            'front_design' => $version->front_design,
            'back_design' => $version->back_design,
        ]);

        return response()->json([
            'message' => "Restored to version {$version->version_number}",
            'data' => $template,
        ]);
    }

    public function deleteTemplate($id)
    {
        $template = StaffBadgeTemplate::findOrFail($id);
        if ($template->badges()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete template that has active badges assigned. Please reassign badges first.',
            ], 422);
        }

        $template->delete();
        return response()->json(['message' => 'Template deleted successfully']);
    }

    // =========================================================================
    // BADGES & CARDS REGISTRY
    // =========================================================================
    public function badges(Request $request)
    {
        $query = StaffBadge::with([
            'employee:id,employee_code,first_name,last_name,phone,email,branch_id,department_id,position_id',
            'employee.branch:id,name,code',
            'template:id,name,code,badge_type,orientation,card_size',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('badge_type')) {
            $query->where('badge_type', $request->badge_type);
        }

        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $query->where(function ($q) use ($s) {
                $q->where('badge_number', 'like', $s)
                  ->orWhere('card_number', 'like', $s)
                  ->orWhere('nfc_uid', 'like', $s)
                  ->orWhereHas('employee', function ($eq) use ($s) {
                      $eq->where('first_name', 'like', $s)
                         ->orWhere('last_name', 'like', $s)
                         ->orWhere('employee_code', 'like', $s);
                  });
            });
        }

        $badges = $query->latest('id')->get();

        return response()->json(['data' => $badges]);
    }

    public function issueBadge(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'template_id' => 'nullable|exists:staff_badge_templates,id',
            'badge_type' => 'nullable|string',
            'nfc_uid' => 'nullable|string|max:80',
            'expires_at' => 'nullable|date',
            'custom_fields' => 'nullable|array',
        ]);

        $employee = Employee::with('branch')->findOrFail($validated['employee_id']);

        // Default template if not specified
        $templateId = $validated['template_id'] ?? null;
        if (!$templateId) {
            $template = StaffBadgeTemplate::where('is_default', true)->first()
                     ?? StaffBadgeTemplate::first();
            $templateId = $template ? $template->id : 1;
        }

        // Generate identifiers
        $badgeSeq = StaffBadge::count() + 1;
        $badgeNumber = 'BDG-' . date('Y') . '-' . str_pad($badgeSeq, 5, '0', STR_PAD_LEFT);
        $cardNumber = 'CRD-' . strtoupper(Str::random(8));
        $qrToken = 'STF-TK-' . bin2hex(random_bytes(16));
        $barcodeValue = $employee->employee_code ?? ('EMP' . str_pad($employee->id, 5, '0', STR_PAD_LEFT));

        $badge = StaffBadge::create([
            'employee_id' => $employee->id,
            'template_id' => $templateId,
            'badge_number' => $badgeNumber,
            'card_number' => $cardNumber,
            'qr_token' => $qrToken,
            'barcode_value' => $barcodeValue,
            'nfc_uid' => $validated['nfc_uid'] ?? null,
            'status' => 'ACTIVE',
            'badge_type' => $validated['badge_type'] ?? 'STAFF',
            'issued_at' => now(),
            'activated_at' => now(),
            'expires_at' => $validated['expires_at'] ?? now()->addYears(2),
            'custom_fields' => $validated['custom_fields'] ?? [],
            'created_by' => auth()->id() ?? 1,
        ]);

        // Audit Log
        StaffBadgeAuditLog::create([
            'badge_id' => $badge->id,
            'action' => 'ISSUED',
            'performed_by' => auth()->id() ?? 1,
            'old_status' => null,
            'new_status' => 'ACTIVE',
            'notes' => "Badge issued to {$employee->first_name} {$employee->last_name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Staff badge generated and activated successfully',
            'data' => $badge->load(['employee.branch', 'template']),
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:ACTIVE,INACTIVE,EXPIRED,BLOCKED,LOST,STOLEN,REVOKED',
            'reason' => 'nullable|string|max:255',
        ]);

        $badge = StaffBadge::findOrFail($id);
        $oldStatus = $badge->status;
        $newStatus = $validated['status'];

        $updateData = ['status' => $newStatus];
        if ($newStatus === 'REVOKED') {
            $updateData['revoked_at'] = now();
        }

        $badge->update($updateData);

        StaffBadgeAuditLog::create([
            'badge_id' => $badge->id,
            'action' => $newStatus === 'BLOCKED' ? 'BLOCKED' : ($newStatus === 'LOST' ? 'REPORTED_LOST' : 'STATUS_CHANGED'),
            'performed_by' => auth()->id() ?? 1,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'notes' => $validated['reason'] ?? "Status updated from {$oldStatus} to {$newStatus}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => "Card status updated to {$newStatus}",
            'data' => $badge->load(['employee', 'template']),
        ]);
    }

    public function replaceBadge(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:255',
            'nfc_uid' => 'nullable|string|max:80',
        ]);

        $oldBadge = StaffBadge::with('employee')->findOrFail($id);
        $oldBadge->update([
            'status' => 'REPLACED',
            'reissue_reason' => $validated['reason'],
            'revoked_at' => now(),
        ]);

        StaffBadgeAuditLog::create([
            'badge_id' => $oldBadge->id,
            'action' => 'REPLACED',
            'performed_by' => auth()->id() ?? 1,
            'old_status' => $oldBadge->status,
            'new_status' => 'REPLACED',
            'notes' => "Replaced due to: " . $validated['reason'],
            'ip_address' => $request->ip(),
        ]);

        // Issue new badge
        $badgeSeq = StaffBadge::count() + 1;
        $newBadge = StaffBadge::create([
            'employee_id' => $oldBadge->employee_id,
            'template_id' => $oldBadge->template_id,
            'badge_number' => 'BDG-' . date('Y') . '-' . str_pad($badgeSeq, 5, '0', STR_PAD_LEFT),
            'card_number' => 'CRD-' . strtoupper(Str::random(8)),
            'qr_token' => 'STF-TK-' . bin2hex(random_bytes(16)),
            'barcode_value' => $oldBadge->barcode_value,
            'nfc_uid' => $validated['nfc_uid'] ?? null,
            'status' => 'ACTIVE',
            'badge_type' => $oldBadge->badge_type,
            'issued_at' => now(),
            'activated_at' => now(),
            'expires_at' => now()->addYears(2),
            'created_by' => auth()->id() ?? 1,
        ]);

        return response()->json([
            'message' => 'Old card revoked and new replacement badge issued successfully',
            'data' => $newBadge->load(['employee.branch', 'template']),
        ]);
    }

    public function bindNfc(Request $request, $id)
    {
        $validated = $request->validate([
            'nfc_uid' => 'required|string|max:80',
        ]);

        $existing = StaffBadge::where('nfc_uid', $validated['nfc_uid'])
            ->where('id', '!=', $id)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => "NFC UID is already mapped to card {$existing->card_number}",
            ], 422);
        }

        $badge = StaffBadge::findOrFail($id);
        $badge->update(['nfc_uid' => $validated['nfc_uid']]);

        StaffBadgeAuditLog::create([
            'badge_id' => $badge->id,
            'action' => 'NFC_BOUND',
            'performed_by' => auth()->id() ?? 1,
            'notes' => "Bound physical NFC Card UID: {$validated['nfc_uid']}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Physical NFC UID mapped successfully',
            'data' => $badge,
        ]);
    }

    // =========================================================================
    // VERIFICATION & SCANNING ENGINE
    // =========================================================================
    public function verifyScan(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string', // QR token, barcode value, or NFC UID
            'scan_type' => 'nullable|in:ATTENDANCE,POS_AUTH,VERIFICATION,STORE_ACCESS',
            'required_role' => 'nullable|string',
            'device_name' => 'nullable|string',
        ]);

        $token = trim($validated['token']);
        $scanType = $validated['scan_type'] ?? 'VERIFICATION';

        // Search badge by QR Token, NFC UID, or Barcode
        $badge = StaffBadge::with([
            'employee.branch',
            'employee.user.roles',
            'template',
        ])
        ->where('qr_token', $token)
        ->orWhere('nfc_uid', $token)
        ->orWhere('card_number', $token)
        ->orWhere('barcode_value', $token)
        ->first();

        if (!$badge) {
            return response()->json([
                'authorized' => false,
                'status' => 'NOT_FOUND',
                'message' => 'Unrecognized staff card or invalid token',
            ], 404);
        }

        $isUsable = $badge->isUsable();
        $statusStr = $isUsable ? 'SUCCESS' : ($badge->status === 'BLOCKED' ? 'BLOCKED' : 'EXPIRED');

        // Log the scan event
        StaffBadgeScanLog::create([
            'badge_id' => $badge->id,
            'employee_id' => $badge->employee_id,
            'scan_type' => $scanType,
            'scanner_device' => $validated['device_name'] ?? 'SmartPOS Terminal / Kiosk',
            'scanner_ip' => $request->ip(),
            'status' => $statusStr,
            'failure_reason' => $isUsable ? null : "Card is currently {$badge->status}",
            'metadata' => [
                'token_used' => substr($token, 0, 10) . '...',
                'employee' => "{$badge->employee->first_name} {$badge->employee->last_name}",
            ],
        ]);

        if (!$isUsable) {
            return response()->json([
                'authorized' => false,
                'status' => $badge->status,
                'message' => "Card access rejected: Badge status is {$badge->status}",
                'badge' => $badge,
            ], 403);
        }

        // Check required role if requested (e.g. for POS Manager Override)
        if (!empty($validated['required_role'])) {
            $user = $badge->employee->user;
            $roles = $user ? $user->roles->pluck('name')->toArray() : [];
            $hasRole = in_array($validated['required_role'], $roles) || in_array('ADMIN', $roles) || in_array('SUPER_ADMIN', $roles);

            if (!$hasRole && $badge->badge_type !== 'MANAGER') {
                return response()->json([
                    'authorized' => false,
                    'status' => 'INSUFFICIENT_PERMISSIONS',
                    'message' => "Operation requires {$validated['required_role']} badge authorization",
                    'employee' => $badge->employee,
                ], 403);
            }
        }

        return response()->json([
            'authorized' => true,
            'status' => 'AUTHORIZED',
            'message' => "Welcome, {$badge->employee->first_name} {$badge->employee->last_name}",
            'badge' => $badge,
            'employee' => $badge->employee,
        ]);
    }

    // =========================================================================
    // METRICS DASHBOARD
    // =========================================================================
    public function metrics()
    {
        $total = StaffBadge::count();
        $active = StaffBadge::where('status', 'ACTIVE')->count();
        $inactive = StaffBadge::where('status', 'INACTIVE')->count();
        $expired = StaffBadge::where('status', 'EXPIRED')
            ->orWhere(function ($q) {
                $q->where('status', 'ACTIVE')->where('expires_at', '<', now());
            })->count();
        $blocked = StaffBadge::where('status', 'BLOCKED')->count();
        $lost = StaffBadge::where('status', 'LOST')->orWhere('status', 'STOLEN')->count();

        $todayScans = StaffBadgeScanLog::whereDate('created_at', today())->count();
        $failedScans = StaffBadgeScanLog::whereDate('created_at', today())
            ->where('status', '!=', 'SUCCESS')->count();

        return response()->json([
            'total_cards' => $total,
            'active_cards' => $active,
            'inactive_cards' => $inactive,
            'expired_cards' => $expired,
            'blocked_cards' => $blocked,
            'lost_cards' => $lost,
            'today_scans' => $todayScans,
            'failed_scans' => $failedScans,
        ]);
    }
}
