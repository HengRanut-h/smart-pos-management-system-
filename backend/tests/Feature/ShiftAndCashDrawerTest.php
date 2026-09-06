<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Modules\Settings\Persistence\Models\SysStatus;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\Employee\Persistence\Models\Employee;
use App\Modules\User\Persistence\Models\User;
use App\Modules\POS\Persistence\Models\PosRegister;
use App\Modules\POS\Persistence\Models\Shift;
use App\Modules\POS\Persistence\Models\CashDrawer;

class ShiftAndCashDrawerTest extends TestCase
{
    use RefreshDatabase;

    private $user;
    private $branch;
    private $register;

    protected function setUp(): void
    {
        parent::setUp();

        $status = SysStatus::create(['domain' => 'SYSTEM', 'code' => 'ACTIVE', 'name' => 'Active']);
        $this->branch = Branch::create(['code' => 'BR01', 'name' => 'Main Branch', 'status_id' => $status->id]);
        $employee = Employee::create([
            'employee_code' => 'EMP01',
            'branch_id' => $this->branch->id,
            'first_name' => 'Cashier',
            'last_name' => 'User',
            'status_id' => $status->id,
        ]);
        $this->user = User::create([
            'username' => 'cashier_test',
            'password' => 'secret',
            'employee_id' => $employee->id,
            'status_id' => $status->id,
        ]);

        $this->register = PosRegister::create([
            'branch_id' => $this->branch->id,
            'code' => 'REG-TEST-01',
            'name' => 'Terminal 1',
            'status' => 'ACTIVE',
        ]);
    }

    public function test_open_shift_and_drawer(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/v1/pos/shifts/open', [
            'register_id' => $this->register->id,
            'opening_cash' => 100.0,
            'notes' => 'Morning shift open',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'OPEN',
                    'opening_cash' => 100.0,
                ]
            ]);

        $this->assertDatabaseHas('shifts', [
            'register_id' => $this->register->id,
            'status' => 'OPEN',
            'opening_cash' => 100.0,
        ]);

        $this->assertDatabaseHas('cash_drawers', [
            'register_id' => $this->register->id,
            'status' => 'OPEN',
            'opening_balance' => 100.0,
            'current_balance' => 100.0,
        ]);
    }

    public function test_cannot_open_second_shift_while_one_is_open(): void
    {
        // Open first
        $this->actingAs($this->user)->postJson('/api/v1/pos/shifts/open', [
            'register_id' => $this->register->id,
            'opening_cash' => 100.0,
        ]);

        // Attempt second
        $response = $this->actingAs($this->user)->postJson('/api/v1/pos/shifts/open', [
            'register_id' => $this->register->id,
            'opening_cash' => 50.0,
        ]);

        $response->assertStatus(500); // InvalidArgumentException
    }

    public function test_cash_movements_in_and_out(): void
    {
        $openRes = $this->actingAs($this->user)->postJson('/api/v1/pos/shifts/open', [
            'register_id' => $this->register->id,
            'opening_cash' => 100.0,
        ]);
        $shiftId = $openRes->json('data.id');

        // Cash In: $50
        $inRes = $this->actingAs($this->user)->postJson('/api/v1/pos/shifts/movement', [
            'shift_id' => $shiftId,
            'type' => 'CASH_IN',
            'amount' => 50.0,
            'reason' => 'Add small change to drawer',
        ]);
        $inRes->assertStatus(201);

        $drawer = CashDrawer::where('register_id', $this->register->id)->first();
        $this->assertEquals(150.0, (float) $drawer->current_balance);

        // Safe Drop: $40
        $outRes = $this->actingAs($this->user)->postJson('/api/v1/pos/shifts/movement', [
            'shift_id' => $shiftId,
            'type' => 'SAFE_DROP',
            'amount' => 40.0,
            'reason' => 'Midday drop to safe',
        ]);
        $outRes->assertStatus(201);

        $drawer->refresh();
        $this->assertEquals(110.0, (float) $drawer->current_balance);
    }

    public function test_close_shift_and_z_report(): void
    {
        $openRes = $this->actingAs($this->user)->postJson('/api/v1/pos/shifts/open', [
            'register_id' => $this->register->id,
            'opening_cash' => 100.0,
        ]);
        $shiftId = $openRes->json('data.id');

        // Cash In: $20
        $this->actingAs($this->user)->postJson('/api/v1/pos/shifts/movement', [
            'shift_id' => $shiftId,
            'type' => 'CASH_IN',
            'amount' => 20.0,
            'reason' => 'Float top-up',
        ]);

        // Expected = 100 + 20 = 120
        // Physical counted = 118 (Short $2)
        $closeRes = $this->actingAs($this->user)->postJson('/api/v1/pos/shifts/close', [
            'shift_id' => $shiftId,
            'actual_cash' => 118.0,
            'notes' => 'Evening register balance count',
        ]);

        $closeRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'expected_cash' => 120.0,
                    'actual_cash' => 118.0,
                    'cash_difference' => -2.0,
                    'reconciliation_result' => 'SHORT',
                ]
            ]);

        $this->assertDatabaseHas('shifts', [
            'id' => $shiftId,
            'status' => 'CLOSED',
            'actual_cash' => 118.0,
            'expected_cash' => 120.0,
            'cash_difference' => -2.0,
        ]);
    }
}
