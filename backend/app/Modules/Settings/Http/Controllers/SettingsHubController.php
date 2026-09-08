<?php

namespace App\Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Modules\Settings\Application\Services\SystemSettingsService;
use App\Modules\Settings\Application\Services\BranchManagementService;
use Illuminate\Support\Str;

class SettingsHubController extends Controller
{
    protected SystemSettingsService $systemService;
    protected BranchManagementService $branchService;

    public function __construct(SystemSettingsService $systemService, BranchManagementService $branchService)
    {
        $this->systemService = $systemService;
        $this->branchService = $branchService;
    }

    // --- Legacy Endpoints for Existing POS Compatibility ---

    public function getSettings(Request $request): JsonResponse
    {
        $branchId = $request->query('branch_id');
        if ($branchId) {
            $settings = $this->branchService->getMergedSettingsForBranch((int)$branchId);
        } else {
            $settings = $this->systemService->getGlobalSettings();
        }

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        $branchId = $request->input('branch_id');

        if ($branchId) {
            $data = $request->except(['branch_id']);
            $updated = $this->branchService->saveBranchOverrides(
                (int)$branchId,
                $data,
                $user ? $user->id : null,
                $request->ip(),
                $request->userAgent()
            );
        } else {
            $updated = $this->systemService->updateGlobalSettings(
                $request->all(),
                $user ? $user->id : null,
                $request->ip(),
                $request->userAgent()
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
            'data' => $updated,
        ]);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp,svg|max:5120',
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
            
            $destinationPath = public_path('storage/store');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            $file->move($destinationPath, $filename);
            $fullUrl = url('/storage/store/' . $filename);

            // Update in global settings
            $this->systemService->updateGlobalSettings(['company_logo_url' => $fullUrl, 'store_logo_url' => $fullUrl]);

            return response()->json([
                'success' => true,
                'message' => 'Store logo uploaded successfully',
                'image_url' => $fullUrl,
                'store_logo_url' => $fullUrl,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No image file provided',
        ], 400);
    }

    // --- Enterprise System Settings & Company ---

    public function getSystemSettings(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->systemService->getGlobalSettings(),
        ]);
    }

    public function getCompany(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->systemService->getCompany(),
        ]);
    }

    public function updateCompany(Request $request): JsonResponse
    {
        $user = $request->user();
        $company = $this->systemService->updateCompany(
            $request->all(),
            $user ? $user->id : null,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'success' => true,
            'message' => 'Company profile updated successfully',
            'data' => $company,
        ]);
    }

    // --- Branch Management ---

    public function getBranches(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->branchService->getAllBranches(),
        ]);
    }

    public function getBranchDetails(int $id): JsonResponse
    {
        $branch = $this->branchService->getBranchDetails($id);
        if (!$branch) {
            return response()->json(['success' => false, 'message' => 'Branch not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $branch,
        ]);
    }

    public function createBranch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:branches,code',
            'name' => 'required|string|max:150',
            'branch_type' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'manager_name' => 'nullable|string',
            'opening_date' => 'nullable|date',
            'tax_rate' => 'nullable|numeric',
        ]);

        $branch = $this->branchService->createBranch($validated);

        return response()->json([
            'success' => true,
            'message' => 'Branch created successfully',
            'data' => $branch,
        ], 201);
    }

    public function updateBranch(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $branch = $this->branchService->updateBranch(
            $id,
            $request->all(),
            $user ? $user->id : null,
            $request->ip(),
            $request->userAgent()
        );

        if (!$branch) {
            return response()->json(['success' => false, 'message' => 'Branch not found'], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Branch updated successfully',
            'data' => $branch,
        ]);
    }

    public function deleteBranch(int $id): JsonResponse
    {
        $deleted = $this->branchService->deleteBranch($id);
        return response()->json([
            'success' => $deleted,
            'message' => $deleted ? 'Branch deleted successfully' : 'Branch not found',
        ]);
    }

    public function getBranchOverrides(int $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->branchService->getBranchOverrides($id),
        ]);
    }

    public function saveBranchOverrides(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $overrides = $this->branchService->saveBranchOverrides(
            $id,
            $request->all(),
            $user ? $user->id : null,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'success' => true,
            'message' => 'Branch overrides saved successfully',
            'data' => $overrides,
        ]);
    }

    public function getMergedSettings(int $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->branchService->getMergedSettingsForBranch($id),
        ]);
    }

    // --- POS Terminals ---

    public function getTerminals(int $branchId): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->branchService->getTerminals($branchId),
        ]);
    }

    public function saveTerminal(Request $request): JsonResponse
    {
        $terminal = $this->branchService->saveTerminal($request->all());
        return response()->json([
            'success' => true,
            'message' => 'POS Terminal saved successfully',
            'data' => $terminal,
        ]);
    }

    public function deleteTerminal(int $id): JsonResponse
    {
        $deleted = $this->branchService->deleteTerminal($id);
        return response()->json([
            'success' => $deleted,
            'message' => $deleted ? 'POS Terminal removed' : 'Terminal not found',
        ]);
    }

    // --- Printers ---

    public function getPrinters(int $branchId): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->branchService->getPrinters($branchId),
        ]);
    }

    public function savePrinter(Request $request): JsonResponse
    {
        $printer = $this->branchService->savePrinter($request->all());
        return response()->json([
            'success' => true,
            'message' => 'Printer device saved successfully',
            'data' => $printer,
        ]);
    }

    public function deletePrinter(int $id): JsonResponse
    {
        $deleted = $this->branchService->deletePrinter($id);
        return response()->json([
            'success' => $deleted,
            'message' => $deleted ? 'Printer removed' : 'Printer not found',
        ]);
    }

    // --- Sequences ---

    public function getSequences(int $branchId): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->branchService->getSequences($branchId),
        ]);
    }

    public function saveSequence(Request $request): JsonResponse
    {
        $seq = $this->branchService->saveSequence($request->all());
        return response()->json([
            'success' => true,
            'message' => 'Numbering sequence updated',
            'data' => $seq,
        ]);
    }

    // --- Business Hours & Holidays ---

    public function getBusinessHours(int $branchId): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->branchService->getBusinessHours($branchId),
        ]);
    }

    public function saveBusinessHours(Request $request, int $branchId): JsonResponse
    {
        $this->branchService->saveBusinessHours($branchId, $request->input('hours', []));
        return response()->json([
            'success' => true,
            'message' => 'Business hours saved successfully',
        ]);
    }

    public function getHolidays(Request $request): JsonResponse
    {
        $branchId = $request->query('branch_id');
        return response()->json([
            'success' => true,
            'data' => $this->branchService->getHolidays($branchId ? (int)$branchId : null),
        ]);
    }

    public function saveHoliday(Request $request): JsonResponse
    {
        $holiday = $this->branchService->saveHoliday($request->all());
        return response()->json([
            'success' => true,
            'message' => 'Holiday record saved successfully',
            'data' => $holiday,
        ]);
    }

    public function deleteHoliday(int $id): JsonResponse
    {
        $deleted = $this->branchService->deleteHoliday($id);
        return response()->json([
            'success' => $deleted,
            'message' => $deleted ? 'Holiday removed' : 'Record not found',
        ]);
    }

    // --- Branch Users ---

    public function getBranchUsers(int $branchId): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->branchService->getBranchUsers($branchId),
        ]);
    }

    public function assignUser(Request $request): JsonResponse
    {
        $bu = $this->branchService->assignUser($request->all());
        return response()->json([
            'success' => true,
            'message' => 'Staff assigned to branch successfully',
            'data' => $bu,
        ]);
    }

    public function removeUser(int $id): JsonResponse
    {
        $deleted = $this->branchService->removeUser($id);
        return response()->json([
            'success' => $deleted,
            'message' => $deleted ? 'Staff branch assignment removed' : 'Assignment not found',
        ]);
    }

    // --- Notifications & Audits ---

    public function getNotifications(Request $request): JsonResponse
    {
        $branchId = $request->query('branch_id');
        return response()->json([
            'success' => true,
            'data' => $this->systemService->getNotificationSettings($branchId ? (int)$branchId : null),
        ]);
    }

    public function saveNotifications(Request $request): JsonResponse
    {
        $branchId = $request->input('branch_id');
        $matrix = $request->input('matrix', []);
        $this->systemService->saveNotificationMatrix($matrix, $branchId ? (int)$branchId : null);

        return response()->json([
            'success' => true,
            'message' => 'Notification rules updated successfully',
        ]);
    }

    public function getAudits(Request $request): JsonResponse
    {
        $limit = $request->query('limit', 100);
        return response()->json([
            'success' => true,
            'data' => $this->systemService->getAuditLogs((int)$limit),
        ]);
    }
}
