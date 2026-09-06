<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Modules\User\Persistence\Models\User;
use App\Modules\Employee\Persistence\Models\Employee;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\Role\Persistence\Models\Role;
use App\Modules\Settings\Persistence\Models\SysStatus;

class UserProfileTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $employee;
    protected $branch;

    protected function setUp(): void
    {
        parent::setUp();

        $activeStatus = SysStatus::firstOrCreate(
            ['domain' => 'COMMON', 'code' => 'ACTIVE'],
            ['name' => 'Active']
        );

        $this->branch = Branch::firstOrCreate(
            ['code' => 'BR-TEST-01'],
            ['name' => 'Main Test Branch', 'address' => 'Phnom Penh', 'status_id' => $activeStatus->id]
        );

        $this->employee = Employee::firstOrCreate(
            ['employee_code' => 'EMP-TEST-01'],
            [
                'branch_id' => $this->branch->id,
                'first_name' => 'Sokha',
                'last_name' => 'Chan',
                'status_id' => $activeStatus->id,
            ]
        );

        $this->user = User::firstOrCreate(
            ['username' => 'sokha_admin'],
            [
                'employee_id' => $this->employee->id,
                'email' => 'sokha@smartpos.local',
                'phone' => '012334455',
                'password' => bcrypt('password123'),
                'status_id' => $activeStatus->id,
            ]
        );

        $role = Role::firstOrCreate(
            ['code' => 'ADMIN'],
            ['name' => 'Administrator', 'status_id' => $activeStatus->id]
        );

        $this->user->roles()->sync([$role->id => ['assigned_by' => 1, 'assigned_at' => now()]]);
    }

    public function test_get_user_profile(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/v1/user/profile');

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertEquals('sokha_admin', $data['username']);
        $this->assertEquals('sokha@smartpos.local', $data['email']);
        $this->assertEquals('Sokha Chan', $data['full_name']);
        $this->assertEquals('EMP-TEST-01', $data['employee_code']);
        $this->assertEquals('Main Test Branch', $data['branch']['name']);
        $this->assertArrayHasKey('stats', $data);
    }

    public function test_update_user_profile(): void
    {
        $payload = [
            'first_name' => 'Sokha Updated',
            'last_name' => 'Chan Updated',
            'email' => 'sokha.new@smartpos.local',
            'phone' => '098776655',
        ];

        $response = $this->actingAs($this->user)->putJson('/api/v1/user/profile', $payload);

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertEquals('sokha.new@smartpos.local', $data['email']);
        $this->assertEquals('Sokha Updated Chan Updated', $data['full_name']);
        $this->assertEquals('098776655', $data['phone']);

        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'email' => 'sokha.new@smartpos.local',
            'phone' => '098776655',
        ]);

        $this->assertDatabaseHas('employees', [
            'id' => $this->employee->id,
            'first_name' => 'Sokha Updated',
        ]);
    }

    public function test_update_password_validation(): void
    {
        // Fails if current password wrong
        $response = $this->actingAs($this->user)->putJson('/api/v1/user/profile', [
            'current_password' => 'wrongpassword',
            'new_password' => 'newsecret123',
        ]);

        $response->assertStatus(422);

        // Succeeds with correct current password
        $responseOk = $this->actingAs($this->user)->putJson('/api/v1/user/profile', [
            'current_password' => 'password123',
            'new_password' => 'newsecret123',
        ]);

        $responseOk->assertStatus(200);
    }
}
