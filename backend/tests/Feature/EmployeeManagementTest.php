<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Modules\Employee\Persistence\Models\Employee;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\Role\Persistence\Models\Role;
use App\Modules\Settings\Persistence\Models\SysStatus;
use App\Modules\User\Persistence\Models\User;

class EmployeeManagementTest extends TestCase
{
    use RefreshDatabase;

    protected $status;
    protected $branch;
    protected $role;

    protected function setUp(): void
    {
        parent::setUp();

        $this->status = SysStatus::firstOrCreate(
            ['domain' => 'COMMON', 'code' => 'ACTIVE'],
            ['name' => 'Active']
        );

        $this->branch = Branch::firstOrCreate(
            ['code' => 'HQ-TEST'],
            ['name' => 'Headquarters Test', 'status_id' => $this->status->id]
        );

        $this->role = Role::firstOrCreate(
            ['code' => 'CASHIER'],
            ['name' => 'Cashier', 'status_id' => $this->status->id]
        );
    }

    public function test_get_employees_list(): void
    {
        Employee::create([
            'employee_code' => 'EMP-101',
            'first_name' => 'Dara',
            'last_name' => 'Vong',
            'branch_id' => $this->branch->id,
            'status_id' => $this->status->id,
        ]);

        $response = $this->getJson('/api/v1/employees');

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));
        $data = $response->json('data.data');
        $this->assertNotEmpty($data);
        $this->assertEquals('Dara', $data[0]['first_name']);
    }

    public function test_create_employee_with_user_login(): void
    {
        $payload = [
            'employee_code' => 'EMP-202',
            'first_name' => 'Sokha',
            'last_name' => 'Chan',
            'phone' => '012999888',
            'email' => 'sokha.cashier@smartpos.com',
            'branch_id' => $this->branch->id,
            'create_user' => true,
            'username' => 'sokha_pos',
            'password' => 'secret123',
            'role_id' => $this->role->id,
        ];

        $response = $this->postJson('/api/v1/employees', $payload);

        $response->assertStatus(201);
        $this->assertTrue($response->json('success'));
        $empData = $response->json('data');
        $this->assertEquals('Sokha', $empData['first_name']);
        $this->assertNotNull($empData['user']);
        $this->assertEquals('sokha_pos', $empData['user']['username']);

        $this->assertDatabaseHas('employees', [
            'employee_code' => 'EMP-202',
            'first_name' => 'Sokha',
        ]);

        $this->assertDatabaseHas('users', [
            'username' => 'sokha_pos',
        ]);
    }

    public function test_update_employee(): void
    {
        $emp = Employee::create([
            'employee_code' => 'EMP-303',
            'first_name' => 'Original',
            'last_name' => 'Name',
            'branch_id' => $this->branch->id,
            'status_id' => $this->status->id,
        ]);

        $payload = [
            'first_name' => 'UpdatedFirst',
            'phone' => '098112233',
        ];

        $response = $this->putJson("/api/v1/employees/{$emp->id}", $payload);

        $response->assertStatus(200);
        $this->assertEquals('UpdatedFirst', $response->json('data.first_name'));
        $this->assertEquals('098112233', $response->json('data.phone'));
    }

    public function test_delete_employee(): void
    {
        $emp = Employee::create([
            'employee_code' => 'EMP-DEL-1',
            'first_name' => 'Departing',
            'last_name' => 'Staff',
            'branch_id' => $this->branch->id,
            'status_id' => $this->status->id,
        ]);

        $response = $this->deleteJson("/api/v1/employees/{$emp->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('employees', ['id' => $emp->id]);
    }

    public function test_get_roles(): void
    {
        $response = $this->getJson('/api/v1/roles');

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));
        $this->assertNotEmpty($response->json('data'));
    }
}
