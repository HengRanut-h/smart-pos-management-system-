<?php

namespace App\Modules\Employee\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Employee\Persistence\Models\Employee;
use App\Modules\Employee\Persistence\Models\Attendance;
use App\Modules\Employee\Persistence\Models\AttendanceQrCode;
use App\Modules\Organization\Persistence\Models\Branch;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    /**
     * List attendance records with filtering and real-time daily metrics
     */
    public function index(Request $request): JsonResponse
    {
        $date = $request->input('date', now()->toDateString());
        $branchId = $request->input('branch_id', 1);

        $query = Attendance::with(['employee.user.roles', 'employee.branch'])
            ->where('branch_id', $branchId)
            ->latest('clock_in');

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('date', [$request->input('start_date'), $request->input('end_date')]);
        } else {
            $query->whereDate('date', $date);
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $records = $query->get();

        // Calculate today's summary metrics
        $totalStaff = Employee::where('status_id', 1)->count();
        $todayRecords = Attendance::whereDate('date', $date)->where('branch_id', $branchId)->get();

        $presentCount = $todayRecords->unique('employee_id')->count();
        $onDutyCount = $todayRecords->whereNull('clock_out')->count();
        $completedCount = $todayRecords->whereNotNull('clock_out')->count();
        $lateCount = $todayRecords->where('status', 'LATE')->count();

        return response()->json([
            'success' => true,
            'data' => $records,
            'metrics' => [
                'date' => $date,
                'total_staff' => $totalStaff,
                'present_count' => $presentCount,
                'on_duty_count' => $onDutyCount,
                'completed_count' => $completedCount,
                'late_count' => $lateCount,
                'attendance_rate' => $totalStaff > 0 ? round(($presentCount / $totalStaff) * 100, 1) : 0,
            ],
        ]);
    }

    /**
     * Super Admin Attendance & Punctuality Audit Report Portal
     */
    public function report(Request $request): JsonResponse
    {
        $branchId = $request->integer('branch_id', 1);
        $preset = $request->input('preset', 'this_month');
        $year = $request->input('year', now()->year);
        $month = $request->input('month');

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $startDate = Carbon::parse($request->input('start_date'))->startOfDay();
            $endDate = Carbon::parse($request->input('end_date'))->endOfDay();
        } else if ($preset === 'this_year' || ($request->filled('year') && !$request->filled('month'))) {
            $startDate = Carbon::createFromDate($year, 1, 1)->startOfDay();
            $endDate = Carbon::createFromDate($year, 12, 31)->endOfDay();
        } else if ($preset === 'last_month') {
            $startDate = now()->subMonth()->startOfMonth();
            $endDate = now()->subMonth()->endOfMonth();
        } else if ($preset === 'this_week') {
            $startDate = now()->startOfWeek();
            $endDate = now()->endOfWeek();
        } else if ($preset === 'today') {
            $startDate = now()->startOfDay();
            $endDate = now()->endOfDay();
        } else {
            $m = $month ? (int)$month : now()->month;
            $startDate = Carbon::createFromDate($year, $m, 1)->startOfMonth();
            $endDate = Carbon::createFromDate($year, $m, 1)->endOfMonth();
        }

        $query = Attendance::with(['employee.user.roles', 'employee.branch'])
            ->whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
            ->latest('clock_in');

        if ($request->filled('branch_id') && $request->input('branch_id') !== 'ALL' && $request->integer('branch_id') > 0) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('punctuality_status') && $request->input('punctuality_status') !== 'ALL') {
            $status = $request->input('punctuality_status');
            if ($status === 'ON_TIME') {
                $query->whereIn('status', ['PRESENT', 'COMPLETED']);
            } else if ($status === 'LATE') {
                $query->where('status', 'LATE');
            }
        }

        $records = $query->get();

        $totalShifts = $records->count();
        $lateShifts = $records->where('status', 'LATE')->count();
        $onTimeShifts = $totalShifts - $lateShifts;
        $onTimePct = $totalShifts > 0 ? round(($onTimeShifts / $totalShifts) * 100, 1) : 100;

        $totalWorkMinutes = $records->sum('total_minutes');
        $totalWorkHours = round($totalWorkMinutes / 60, 2);

        $durationDays = floor($totalWorkMinutes / (60 * 24));
        $remainingMinsAfterDays = $totalWorkMinutes % (60 * 24);
        $durationHours = floor($remainingMinsAfterDays / 60);
        $durationMins = $remainingMinsAfterDays % 60;
        $formattedGranularDuration = "{$durationDays}d {$durationHours}h {$durationMins}m";

        $totalLateMinutes = 0;
        $formattedRecords = $records->map(function ($rec) use (&$totalLateMinutes) {
            $clockIn = Carbon::parse($rec->clock_in);
            $scheduled = Carbon::parse($rec->date->toDateString() . ' 08:30:00');
            $lateMins = 0;
            if ($clockIn->greaterThan($scheduled)) {
                $lateMins = (int)round($scheduled->diffInMinutes($clockIn));
            }
            $totalLateMinutes += $lateMins;

            $arr = $rec->toArray();
            $arr['late_minutes'] = $lateMins;
            $arr['scheduled_start'] = '08:30 AM';
            return $arr;
        });

        $employeeSummaries = [];
        $grouped = $records->groupBy('employee_id');

        $globalRegHours = 0;
        $globalOtHours = 0;
        $globalRegPay = 0;
        $globalOtPay = 0;
        $globalLateDeductions = 0;

        foreach ($grouped as $empId => $empRecords) {
            $emp = $empRecords->first()->employee;
            if (!$emp) continue;

            $empShifts = $empRecords->count();
            $empLate = $empRecords->where('status', 'LATE')->count();
            $empOnTime = $empShifts - $empLate;
            $empMinutes = $empRecords->sum('total_minutes');
            $empHours = round($empMinutes / 60, 2);

            $empRegularMins = 0;
            $empOtMins = 0;
            $empLateMins = 0;

            foreach ($empRecords as $r) {
                $m = $r->total_minutes ?? 0;
                $regM = min(480, $m);
                $otM = max(0, $m - 480);
                $empRegularMins += $regM;
                $empOtMins += $otM;

                $cIn = Carbon::parse($r->clock_in);
                $sch = Carbon::parse($r->date->toDateString() . ' 08:30:00');
                if ($cIn->greaterThan($sch)) {
                    $empLateMins += (int)round($sch->diffInMinutes($cIn));
                }
            }

            $empDays = floor($empMinutes / (60 * 24));
            $remMins = $empMinutes % (60 * 24);
            $empH = floor($remMins / 60);
            $empM = $remMins % 60;

            // Pay rate defaults (with role-based fallback)
            $roleRates = [
                'Super Admin' => 10.00,
                'Admin' => 8.00,
                'Store Manager' => 6.00,
                'Manager' => 6.00,
                'Supervisor' => 4.50,
                'POS Cashier' => 3.00,
                'Cashier' => 3.00,
                'Inventory Clerk' => 3.50,
                'Inventory Staff' => 3.50,
                'Delivery Driver' => 3.25,
            ];
            $roleName = $emp->user->roles[0]->name ?? 'POS Cashier';
            $defaultRoleRate = $roleRates[$roleName] ?? 3.00;

            $employmentType = $emp->employment_type ?? 'FULL_TIME';
            $hourlyRate = (float)($emp->hourly_rate ?: $defaultRoleRate);
            $otMultiplier = (float)($emp->ot_multiplier ?? 1.50);
            $otRate = (float)($emp->ot_hourly_rate ?? round($hourlyRate * $otMultiplier, 2));
            $latePenaltyRate = (float)($emp->late_deduction_per_min ?? 0.05);

            $regHours = round($empRegularMins / 60, 2);
            $otHours = round($empOtMins / 60, 2);

            $regPay = round($regHours * $hourlyRate, 2);
            $otPay = round($otHours * $otRate, 2);
            $lateDed = round($empLateMins * $latePenaltyRate, 2);
            $netSalary = round(($regPay + $otPay) - $lateDed, 2);

            $globalRegHours += $regHours;
            $globalOtHours += $otHours;
            $globalRegPay += $regPay;
            $globalOtPay += $otPay;
            $globalLateDeductions += $lateDed;

            $employeeSummaries[] = [
                'employee_id' => $emp->id,
                'employee_code' => $emp->employee_code,
                'name' => $emp->first_name . ' ' . $emp->last_name,
                'role' => $emp->user->roles[0]->name ?? 'POS Cashier',
                'phone' => $emp->phone,
                'employment_type' => $employmentType,
                'hourly_rate' => $hourlyRate,
                'ot_multiplier' => $otMultiplier,
                'ot_rate' => $otRate,
                'late_penalty_rate' => $latePenaltyRate,
                'total_shifts' => $empShifts,
                'on_time_shifts' => $empOnTime,
                'late_shifts' => $empLate,
                'punctuality_rate' => $empShifts > 0 ? round(($empOnTime / $empShifts) * 100, 1) : 100,
                'total_minutes' => $empMinutes,
                'total_hours' => $empHours,
                'regular_hours' => $regHours,
                'ot_hours' => $otHours,
                'regular_pay' => $regPay,
                'ot_pay' => $otPay,
                'late_deduction' => $lateDed,
                'net_salary' => $netSalary,
                'formatted_duration' => "{$empDays}d {$empH}h {$empM}m",
                'total_late_minutes' => $empLateMins,
            ];
        }

        $totalNetPayroll = round(($globalRegPay + $globalOtPay) - $globalLateDeductions, 2);

        return response()->json([
            'success' => true,
            'period' => [
                'preset' => $preset,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'metrics' => [
                'total_shifts' => $totalShifts,
                'on_time_shifts' => $onTimeShifts,
                'late_shifts' => $lateShifts,
                'on_time_percentage' => $onTimePct,
                'total_work_minutes' => $totalWorkMinutes,
                'total_work_hours' => $totalWorkHours,
                'formatted_duration' => $formattedGranularDuration,
                'duration_breakdown' => [
                    'days' => $durationDays,
                    'hours' => $durationHours,
                    'minutes' => $durationMins,
                ],
                'total_late_minutes' => $totalLateMinutes,
            ],
            'payroll_summary' => [
                'total_regular_hours' => round($globalRegHours, 2),
                'total_ot_hours' => round($globalOtHours, 2),
                'total_regular_pay' => round($globalRegPay, 2),
                'total_ot_pay' => round($globalOtPay, 2),
                'total_late_deductions' => round($globalLateDeductions, 2),
                'net_total_payroll' => $totalNetPayroll,
            ],
            'employee_summaries' => $employeeSummaries,
            'records' => $formattedRecords,
        ]);
    }

    /**
     * Store QR Codes Management APIs
     */
    public function indexQrCodes(Request $request): JsonResponse
    {
        $query = AttendanceQrCode::with(['store', 'attendances']);

        if ($request->filled('store_id')) {
            $query->where('store_id', $request->integer('store_id'));
        }

        if ($request->filled('status') && $request->input('status') !== 'ALL') {
            $query->where('status', $request->input('status'));
        }

        $qrCodes = $query->latest('id')->get()->map(function ($item) {
            $arr = $item->toArray();
            $arr['total_scans'] = $item->attendances()->count();
            $arr['is_expired'] = $item->expires_at ? now()->greaterThan($item->expires_at) : false;
            return $arr;
        });

        $stores = Branch::all();

        return response()->json([
            'success' => true,
            'data' => $qrCodes,
            'stores' => $stores,
        ]);
    }

    public function storeQrCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_id' => 'required|integer|exists:branches,id',
            'name' => 'nullable|string|max:150',
            'expires_at' => 'nullable|date',
        ]);

        $store = Branch::findOrFail($validated['store_id']);
        $uuid = (string) Str::uuid();
        $token = "SMARTPOS-ATT-{$store->code}-" . substr($uuid, 0, 8);

        $qrCode = AttendanceQrCode::create([
            'store_id' => $store->id,
            'qr_token' => $token,
            'name' => $validated['name'] ?? "{$store->name} Storefront QR Standee",
            'status' => 'ACTIVE',
            'expires_at' => $validated['expires_at'] ?? null,
        ]);

        $qrCode->load('store');

        return response()->json([
            'success' => true,
            'message' => 'Store Attendance QR Code created successfully',
            'data' => $qrCode,
        ], 201);
    }

    public function regenerateQrCode(Request $request, $id): JsonResponse
    {
        $qrCode = AttendanceQrCode::with('store')->findOrFail($id);
        $storeCode = $qrCode->store ? $qrCode->store->code : 'HQ-01';
        $uuid = (string) Str::uuid();
        $newToken = "SMARTPOS-ATT-{$storeCode}-" . substr($uuid, 0, 8);

        $qrCode->update([
            'qr_token' => $newToken,
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'QR Token regenerated successfully',
            'data' => $qrCode,
        ]);
    }

    public function updateQrCodeStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:ACTIVE,INACTIVE,EXPIRED',
        ]);

        $qrCode = AttendanceQrCode::with('store')->findOrFail($id);
        $qrCode->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => "Store QR Code status updated to {$validated['status']}",
            'data' => $qrCode,
        ]);
    }

    public function deleteQrCode($id): JsonResponse
    {
        $qrCode = AttendanceQrCode::findOrFail($id);
        $qrCode->delete();

        return response()->json([
            'success' => true,
            'message' => 'Store QR Code deleted successfully',
        ]);
    }

    /**
     * Get Storefront Attendance QR payload & standee details
     */
    public function storeQr(Request $request): JsonResponse
    {
        $branchId = $request->integer('branch_id', 1);
        $branch = Branch::find($branchId) ?? Branch::first();

        // Check if active AttendanceQrCode exists for this branch, else auto-create primary one
        $qrCodeRecord = AttendanceQrCode::where('store_id', $branchId)->where('status', 'ACTIVE')->first();
        if (!$qrCodeRecord && $branch) {
            $uuid = (string) Str::uuid();
            $token = "SMARTPOS-ATT-{$branch->code}-" . substr($uuid, 0, 8);
            $qrCodeRecord = AttendanceQrCode::create([
                'store_id' => $branch->id,
                'qr_token' => $token,
                'name' => "{$branch->name} Main Entrance QR",
                'status' => 'ACTIVE',
            ]);
        }

        $token = $qrCodeRecord ? $qrCodeRecord->qr_token : "SMARTPOS:ATTENDANCE:" . ($branch ? $branch->code : "HQ-01") . ":BRANCH-" . ($branch ? $branch->id : 1);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $qrCodeRecord ? $qrCodeRecord->id : null,
                'branch_id' => $branch ? $branch->id : 1,
                'branch_name' => $branch ? $branch->name : 'Phnom Penh Headquarters',
                'branch_code' => $branch ? $branch->code : 'HQ-01',
                'qr_token' => $token,
                'name' => $qrCodeRecord ? $qrCodeRecord->name : 'SmartPOS Storefront QR',
                'store_title' => 'SmartPOS Official Storefront',
                'instructions' => 'Employees: Scan this Store QR Code with your smartphone camera to Check In / Check Out',
            ],
        ]);
    }

    /**
     * Employee Mobile Self-Scan Storefront QR Code Endpoint with Security Validation
     */
    public function scanStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_qr_code' => 'required|string',
            'employee_id' => 'nullable|integer|exists:employees,id',
            'method' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'device_info' => 'nullable|string',
        ]);

        $tokenInput = trim($validated['store_qr_code']);
        $scanMethod = $validated['method'] ?? 'QR_SCAN';
        $ipAddress = $request->ip();
        $deviceInfo = $validated['device_info'] ?? $request->header('User-Agent');
        $lat = $validated['latitude'] ?? null;
        $lng = $validated['longitude'] ?? null;

        // 1. Verify QR Token against attendance_qr_codes table
        $qrRecord = AttendanceQrCode::where('qr_token', $tokenInput)->first();
        $targetStoreId = 1;
        $qrCodeId = null;

        if ($qrRecord) {
            if ($qrRecord->status !== 'ACTIVE') {
                return response()->json([
                    'success' => false,
                    'message' => "This Store QR Code is currently INACTIVE. Please contact store management.",
                    'sound_cue' => 'ERROR',
                ], 422);
            }

            if ($qrRecord->expires_at && now()->greaterThan($qrRecord->expires_at)) {
                $qrRecord->update(['status' => 'EXPIRED']);
                return response()->json([
                    'success' => false,
                    'message' => "This Store QR Code has expired. Please ask management to regenerate.",
                    'sound_cue' => 'ERROR',
                ], 422);
            }

            $targetStoreId = $qrRecord->store_id;
            $qrCodeId = $qrRecord->id;
        } else if (str_contains($tokenInput, 'SMARTPOS:ATTENDANCE')) {
            if (preg_match('/BRANCH-(\d+)/', $tokenInput, $matches)) {
                $targetStoreId = (int)$matches[1];
            }
        } else {
            return response()->json([
                'success' => false,
                'message' => "Invalid Store QR Code scanned. Please scan an official Storefront Attendance QR code.",
                'sound_cue' => 'ERROR',
            ], 422);
        }

        // 2. Validate Employee
        $employeeId = $validated['employee_id'] ?? null;
        if ($employeeId) {
            $employee = Employee::with(['user.roles', 'branch'])->find($employeeId);
        } else {
            $employee = Employee::with(['user.roles', 'branch'])->where('status_id', 1)->first();
        }

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => "Employee account not found. Please log in to your staff account.",
                'sound_cue' => 'ERROR',
            ], 404);
        }

        $today = now()->toDateString();
        $now = now();
        $scheduledStart = Carbon::parse($today . ' 08:30:00');

        // Prevent Duplicate Scans (within 15 seconds)
        $activeAttendance = Attendance::where('employee_id', $employee->id)
            ->whereNull('clock_out')
            ->latest('id')
            ->first();

        if ($activeAttendance) {
            $clockInTime = Carbon::parse($activeAttendance->clock_in);
            $secondsSinceClockIn = $clockInTime->diffInSeconds($now);

            if ($secondsSinceClockIn < 15) {
                return response()->json([
                    'success' => true,
                    'action' => 'CLOCKED_IN',
                    'message' => "Welcome {$employee->first_name} {$employee->last_name}! You are already clocked in (at " . $clockInTime->format('h:i A') . "). Duplicate scan ignored.",
                    'sound_cue' => 'CHIME_IN',
                    'employee' => $employee,
                    'attendance' => $activeAttendance,
                ]);
            }

            $totalMinutes = max(1, $clockInTime->diffInMinutes($now));
            $hours = floor($totalMinutes / 60);
            $mins = $totalMinutes % 60;
            $durationText = "{$hours}h {$mins}m";

            $activeAttendance->update([
                'clock_out' => $now,
                'total_minutes' => $totalMinutes,
                'status' => $activeAttendance->status === 'LATE' ? 'LATE' : 'COMPLETED',
                'scan_method' => $scanMethod,
                'type' => 'check_out',
                'attendance_qr_code_id' => $qrCodeId,
                'latitude' => $lat ?? $activeAttendance->latitude,
                'longitude' => $lng ?? $activeAttendance->longitude,
                'ip_address' => $ipAddress,
                'device_info' => $deviceInfo,
            ]);

            $activeAttendance->refresh();

            return response()->json([
                'success' => true,
                'action' => 'CLOCKED_OUT',
                'message' => "Goodbye {$employee->first_name} {$employee->last_name}! Clocked out at " . $now->format('h:i A') . ". Shift duration: {$durationText}.",
                'sound_cue' => 'CHIME_OUT',
                'employee' => $employee,
                'attendance' => $activeAttendance,
            ]);
        }

        $isLate = $now->greaterThan($scheduledStart);
        $status = $isLate ? 'LATE' : 'PRESENT';

        $attendance = Attendance::create([
            'employee_id' => $employee->id,
            'branch_id' => $targetStoreId,
            'attendance_qr_code_id' => $qrCodeId,
            'type' => 'check_in',
            'date' => $today,
            'clock_in' => $now,
            'clock_out' => null,
            'total_minutes' => 0,
            'status' => $status,
            'scan_method' => $scanMethod,
            'latitude' => $lat,
            'longitude' => $lng,
            'ip_address' => $ipAddress,
            'device_info' => $deviceInfo,
        ]);

        $statusNote = $isLate ? " (Recorded as Late arrival)" : "";

        return response()->json([
            'success' => true,
            'action' => 'CLOCKED_IN',
            'message' => "Welcome {$employee->first_name} {$employee->last_name}! Clocked in at " . $now->format('h:i A') . "{$statusNote}.",
            'sound_cue' => 'CHIME_IN',
            'employee' => $employee,
            'attendance' => $attendance,
        ]);
    }

    /**
     * Core Badge Scan / Camera Punch endpoint
     */
    public function scan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'barcode' => 'required|string',
            'method' => 'nullable|string|in:BARCODE_SCANNER,CAMERA,MANUAL',
        ]);

        $rawBarcode = trim($validated['barcode']);
        $upperBarcode = strtoupper($rawBarcode);
        $scanMethod = $validated['method'] ?? 'BARCODE_SCANNER';

        $employee = Employee::with(['user.roles', 'branch'])
            ->where('employee_code', $rawBarcode)
            ->orWhere('employee_code', $upperBarcode)
            ->orWhere('employee_code', 'EMP-' . str_pad($rawBarcode, 3, '0', STR_PAD_LEFT))
            ->orWhere('employee_code', 'EMP-' . str_pad($upperBarcode, 3, '0', STR_PAD_LEFT))
            ->orWhere('phone', $rawBarcode)
            ->when(is_numeric($rawBarcode), function ($q) use ($rawBarcode) {
                $q->orWhere('id', (int) $rawBarcode);
            })
            ->first();

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => "Staff barcode '{$rawBarcode}' not recognized. Please scan a valid employee badge.",
                'sound_cue' => 'ERROR',
            ], 404);
        }

        $today = now()->toDateString();
        $now = now();
        $scheduledStart = Carbon::parse($today . ' 08:30:00');

        $activeAttendance = Attendance::where('employee_id', $employee->id)
            ->whereNull('clock_out')
            ->latest('id')
            ->first();

        if ($activeAttendance) {
            $clockInTime = Carbon::parse($activeAttendance->clock_in);
            $secondsSinceClockIn = $clockInTime->diffInSeconds($now);

            if ($secondsSinceClockIn < 15) {
                return response()->json([
                    'success' => true,
                    'action' => 'CLOCKED_IN',
                    'message' => "Welcome {$employee->first_name} {$employee->last_name}! You are already clocked in (at " . $clockInTime->format('h:i A') . ").",
                    'sound_cue' => 'CHIME_IN',
                    'employee' => $employee,
                    'attendance' => $activeAttendance,
                ]);
            }

            $totalMinutes = max(1, $clockInTime->diffInMinutes($now));
            $hours = floor($totalMinutes / 60);
            $mins = $totalMinutes % 60;
            $durationText = "{$hours}h {$mins}m";

            $activeAttendance->update([
                'clock_out' => $now,
                'total_minutes' => $totalMinutes,
                'status' => $activeAttendance->status === 'LATE' ? 'LATE' : 'COMPLETED',
                'scan_method' => $scanMethod,
            ]);

            $activeAttendance->refresh();

            return response()->json([
                'success' => true,
                'action' => 'CLOCKED_OUT',
                'message' => "Goodbye {$employee->first_name} {$employee->last_name}! Clocked out at " . $now->format('h:i A') . ". Shift duration: {$durationText}.",
                'sound_cue' => 'CHIME_OUT',
                'employee' => $employee,
                'attendance' => $activeAttendance,
            ]);
        }

        $isLate = $now->greaterThan($scheduledStart);
        $status = $isLate ? 'LATE' : 'PRESENT';

        $attendance = Attendance::create([
            'employee_id' => $employee->id,
            'branch_id' => $employee->branch_id ?? 1,
            'date' => $today,
            'clock_in' => $now,
            'clock_out' => null,
            'total_minutes' => 0,
            'status' => $status,
            'scan_method' => $scanMethod,
        ]);

        $statusNote = $isLate ? " (Recorded as Late arrival)" : "";

        return response()->json([
            'success' => true,
            'action' => 'CLOCKED_IN',
            'message' => "Welcome {$employee->first_name} {$employee->last_name}! Clocked in at " . $now->format('h:i A') . "{$statusNote}.",
            'sound_cue' => 'CHIME_IN',
            'employee' => $employee,
            'attendance' => $attendance,
        ]);
    }

    /**
     * Manual punch or supervisor adjustment
     */
    public function manual(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|integer|exists:employees,id',
            'date' => 'required|date',
            'clock_in' => 'required|date_format:H:i',
            'clock_out' => 'nullable|date_format:H:i',
            'status' => 'nullable|string|in:PRESENT,LATE,COMPLETED,OVERTIME',
            'notes' => 'nullable|string',
        ]);

        $clockInDateTime = Carbon::parse($validated['date'] . ' ' . $validated['clock_in']);
        $clockOutDateTime = !empty($validated['clock_out'])
            ? Carbon::parse($validated['date'] . ' ' . $validated['clock_out'])
            : null;

        $totalMinutes = $clockOutDateTime ? max(0, $clockInDateTime->diffInMinutes($clockOutDateTime)) : 0;

        $emp = Employee::findOrFail($validated['employee_id']);

        $attendance = Attendance::create([
            'employee_id' => $emp->id,
            'branch_id' => $emp->branch_id ?? 1,
            'date' => $validated['date'],
            'clock_in' => $clockInDateTime,
            'clock_out' => $clockOutDateTime,
            'total_minutes' => $totalMinutes,
            'status' => $validated['status'] ?? ($clockOutDateTime ? 'COMPLETED' : 'PRESENT'),
            'scan_method' => 'MANUAL',
            'notes' => $validated['notes'] ?? 'Manual entry by supervisor',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Attendance logged manually.',
            'data' => $attendance->load('employee'),
        ], 201);
    }

    /**
     * Update supervisor reason / notes for an attendance record
     */
    public function updateRecordNotes(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'notes' => 'required|string|max:1000',
        ]);

        $attendance = Attendance::with(['employee.branch', 'employee.user.roles'])->findOrFail($id);
        $attendance->update([
            'notes' => $validated['notes'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Attendance reason / note updated successfully',
            'data' => $attendance,
        ]);
    }
}
