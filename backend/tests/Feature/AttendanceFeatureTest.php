<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Modules\Settings\Persistence\Models\SysStatus;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\Employee\Persistence\Models\Employee;
use App\Modules\Employee\Persistence\Models\Attendance;

class AttendanceFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected Employee $employee;
    protected Branch $branch;

    protected function setUp(): void
    {
        parent::setUp();

        $status = SysStatus::firstOrCreate(
            ['domain' => 'COMMON', 'code' => 'ACTIVE'],
            ['name' => 'Active']
        );

        $this->branch = Branch::firstOrCreate(
            ['code' => 'HQ-01'],
            ['name' => 'Phnom Penh Headquarters', 'status_id' => $status->id]
        );

        $this->employee = Employee::create([
            'employee_code' => 'EMP-004',
            'branch_id' => $this->branch->id,
            'first_name' => 'Dara',
            'last_name' => 'Vong',
            'gender' => 'Male',
            'phone' => '+855 77 334 112',
            'email' => 'dara.vong@smartpos.com',
            'hire_date' => '2024-03-10',
            'status_id' => $status->id,
        ]);
    }

    public function test_can_list_attendances_and_metrics(): void
    {
        $response = $this->getJson('/api/v1/attendances');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
                'metrics' => [
                    'date',
                    'total_staff',
                    'present_count',
                    'on_duty_count',
                    'completed_count',
                    'late_count',
                    'attendance_rate',
                ],
            ]);
    }

    public function test_can_clock_in_via_barcode_scan(): void
    {
        $response = $this->postJson('/api/v1/attendances/scan', [
            'barcode' => $this->employee->employee_code,
            'method' => 'BARCODE_SCANNER',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'action' => 'CLOCKED_IN',
                'sound_cue' => 'CHIME_IN',
            ])
            ->assertJsonPath('employee.employee_code', $this->employee->employee_code);

        $this->assertDatabaseHas('attendances', [
            'employee_id' => $this->employee->id,
            'scan_method' => 'BARCODE_SCANNER',
        ]);
    }

    public function test_can_clock_out_via_second_barcode_scan(): void
    {
        // First clock in
        $attendance = Attendance::create([
            'employee_id' => $this->employee->id,
            'branch_id' => $this->branch->id,
            'date' => now()->toDateString(),
            'clock_in' => now()->subHours(8),
            'status' => 'PRESENT',
            'scan_method' => 'BARCODE_SCANNER',
        ]);

        // Second scan -> Clocks out
        $response = $this->postJson('/api/v1/attendances/scan', [
            'barcode' => $this->employee->employee_code,
            'method' => 'CAMERA',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'action' => 'CLOCKED_OUT',
                'sound_cue' => 'CHIME_OUT',
            ]);

        $attendance->refresh();
        $this->assertNotNull($attendance->clock_out);
        $this->assertGreaterThan(0, $attendance->total_minutes);
    }

    public function test_unrecognized_barcode_returns_404(): void
    {
        $response = $this->postJson('/api/v1/attendances/scan', [
            'barcode' => 'UNKNOWN-BARCODE-999999',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'sound_cue' => 'ERROR',
            ]);
    }

    public function test_manager_can_create_manual_attendance(): void
    {
        $response = $this->postJson('/api/v1/attendances/manual', [
            'employee_id' => $this->employee->id,
            'date' => now()->toDateString(),
            'clock_in' => '08:00',
            'clock_out' => '17:00',
            'status' => 'COMPLETED',
            'notes' => 'Approved shift manual entry',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Attendance logged manually.',
            ]);

        $this->assertDatabaseHas('attendances', [
            'employee_id' => $this->employee->id,
            'status' => 'COMPLETED',
            'scan_method' => 'MANUAL',
            'total_minutes' => 540,
        ]);
    }

    public function test_can_fetch_store_attendance_qr(): void
    {
        $response = $this->getJson('/api/v1/attendances/store-qr');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonPath('data.branch_code', 'HQ-01');
    }

    public function test_employee_can_scan_store_qr_to_clock_in(): void
    {
        $response = $this->postJson('/api/v1/attendances/scan-store', [
            'store_qr_code' => 'SMARTPOS:ATTENDANCE:HQ-01:BRANCH-1',
            'employee_id' => $this->employee->id,
            'method' => 'MOBILE_CAMERA',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'action' => 'CLOCKED_IN',
            ]);
    }

    public function test_can_generate_attendance_punctuality_report(): void
    {
        $response = $this->getJson('/api/v1/attendances/report?preset=this_month');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'period' => ['preset', 'start_date', 'end_date'],
                'metrics' => [
                    'total_shifts',
                    'on_time_shifts',
                    'late_shifts',
                    'on_time_percentage',
                    'total_work_minutes',
                    'total_work_hours',
                    'formatted_duration',
                    'duration_breakdown' => ['days', 'hours', 'minutes'],
                    'total_late_minutes',
                ],
                'employee_summaries',
                'records',
            ]);
    }

    public function test_admin_can_manage_store_qr_codes(): void
    {
        // 1. Create QR code
        $createRes = $this->postJson('/api/v1/attendances/qr-codes', [
            'store_id' => $this->branch->id,
            'name' => 'Front Gate Standee QR',
        ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Front Gate Standee QR');

        $qrId = $createRes->json('data.id');
        $token = $createRes->json('data.qr_token');

        $this->assertNotNull($token);
        $this->assertStringContainsString('SMARTPOS-ATT-', $token);

        // 2. List QR codes
        $listRes = $this->getJson('/api/v1/attendances/qr-codes');
        $listRes->assertStatus(200)
            ->assertJsonPath('success', true);

        // 3. Regenerate QR token
        $regenRes = $this->postJson("/api/v1/attendances/qr-codes/{$qrId}/regenerate");
        $regenRes->assertStatus(200)
            ->assertJsonPath('success', true);
        
        $newToken = $regenRes->json('data.qr_token');
        $this->assertNotEquals($token, $newToken);

        // 4. Update status to INACTIVE
        $statusRes = $this->patchJson("/api/v1/attendances/qr-codes/{$qrId}/status", [
            'status' => 'INACTIVE',
        ]);
        $statusRes->assertStatus(200)
            ->assertJsonPath('data.status', 'INACTIVE');

        // 5. Delete QR code
        $delRes = $this->deleteJson("/api/v1/attendances/qr-codes/{$qrId}");
        $delRes->assertStatus(200);
    }

    public function test_employee_can_scan_secure_store_qr_code_with_location(): void
    {
        // Create active Store QR
        $createRes = $this->postJson('/api/v1/attendances/qr-codes', [
            'store_id' => $this->branch->id,
            'name' => 'Entrance QR',
        ]);
        $token = $createRes->json('data.qr_token');

        // Clock In via Store QR
        $scan1 = $this->postJson('/api/v1/attendances/scan-store', [
            'store_qr_code' => $token,
            'employee_id' => $this->employee->id,
            'method' => 'QR_SCAN',
            'latitude' => 11.5564,
            'longitude' => 104.9282,
            'device_info' => 'Mozilla/5.0 (iPhone)',
        ]);

        $scan1->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('action', 'CLOCKED_IN')
            ->assertJsonPath('attendance.scan_method', 'QR_SCAN');

        $this->assertDatabaseHas('attendances', [
            'employee_id' => $this->employee->id,
            'type' => 'check_in',
            'latitude' => 11.5564,
            'longitude' => 104.9282,
        ]);
    }

    public function test_attendance_report_calculates_payroll_and_hours_breakdown(): void
    {
        // Update employee pay rates
        $this->employee->update([
            'hourly_rate' => 4.00,
            'ot_multiplier' => 1.50,
            'late_deduction_per_min' => 0.10,
        ]);

        // Create shift record (9 hours = 8h regular + 1h OT)
        Attendance::create([
            'employee_id' => $this->employee->id,
            'branch_id' => $this->branch->id,
            'date' => now()->toDateString(),
            'clock_in' => now()->startOfDay()->addHours(8)->addMinutes(45), // 15 mins late vs 08:30 AM
            'clock_out' => now()->startOfDay()->addHours(17)->addMinutes(45), // 9 hours total (540 mins)
            'total_minutes' => 540,
            'status' => 'LATE',
            'scan_method' => 'QR_SCAN',
        ]);

        $startDate = now()->startOfMonth()->toDateString();
        $endDate = now()->endOfMonth()->toDateString();
        $response = $this->getJson("/api/v1/attendances/report?start_date={$startDate}&end_date={$endDate}&branch_id={$this->branch->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'payroll_summary' => [
                    'total_regular_hours',
                    'total_ot_hours',
                    'total_regular_pay',
                    'total_ot_pay',
                    'total_late_deductions',
                    'net_total_payroll',
                ],
            ]);

        $summaries = $response->json('employee_summaries');
        $empSummary = collect($summaries)->firstWhere('employee_id', $this->employee->id);
        $this->assertNotNull($empSummary);
        $this->assertEquals(8.0, $empSummary['regular_hours']);
        $this->assertEquals(1.0, $empSummary['ot_hours']);
        $this->assertEquals(32.0, $empSummary['regular_pay']); // 8 * $4
        $this->assertEquals(6.0, $empSummary['ot_pay']);      // 1 * $6 ($4 * 1.5)
        $this->assertEquals(1.5, $empSummary['late_deduction']); // 15m * $0.10
        $this->assertEquals(36.5, $empSummary['net_salary']);  // (32 + 6) - 1.5 = 36.5
    }
}




