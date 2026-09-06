<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Modules\Settings\Persistence\Models\SysStatus;
use App\Modules\Role\Persistence\Models\Role;
use App\Modules\Permission\Persistence\Models\Permission;

class RoleAndPermissionTest extends TestCase
{
    use RefreshDatabase;

    protected SysStatus $status;
    protected Role $role;
    protected Permission $permission1;
    protected Permission $permission2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->status = SysStatus::firstOrCreate(
            ['domain' => 'SYSTEM', 'code' => 'ACTIVE'],
            ['name' => 'Active']
        );

        $this->role = Role::create([
            'name' => 'Custom Shift Supervisor',
            'code' => 'CUSTOM_SHIFT_SUPERVISOR',
            'description' => 'Supervises store floor and cashiers',
            'status_id' => $this->status->id,
        ]);

        $this->permission1 = Permission::create([
            'name' => 'View Products',
            'code' => 'product.view',
            'module' => 'Product',
            'action' => 'view',
            'status_id' => $this->status->id,
        ]);

        $this->permission2 = Permission::create([
            'name' => 'Process Refund',
            'code' => 'sale.refund',
            'module' => 'Sales',
            'action' => 'refund',
            'status_id' => $this->status->id,
        ]);
    }

    public function test_can_list_roles_with_permissions(): void
    {
        $response = $this->getJson('/api/v1/roles');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'code', 'description', 'permissions']
                ]
            ]);
    }

    public function test_can_list_permissions_grouped_by_module(): void
    {
        $response = $this->getJson('/api/v1/roles/permissions');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data',
                'grouped' => [
                    'Product',
                    'Sales',
                ]
            ]);
    }

    public function test_can_create_new_role_with_permissions(): void
    {
        $response = $this->postJson('/api/v1/roles', [
            'name' => 'Junior Auditor',
            'code' => 'JUNIOR_AUDITOR',
            'description' => 'Inspects daily cash reports',
            'permission_ids' => [$this->permission1->id],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Junior Auditor')
            ->assertJsonPath('data.code', 'JUNIOR_AUDITOR');

        $this->assertDatabaseHas('roles', [
            'name' => 'Junior Auditor',
            'code' => 'JUNIOR_AUDITOR',
        ]);
    }

    public function test_can_update_role_and_sync_permissions(): void
    {
        $response = $this->putJson("/api/v1/roles/{$this->role->id}", [
            'name' => 'Senior Shift Lead',
            'permission_ids' => [$this->permission1->id, $this->permission2->id],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Senior Shift Lead');

        $this->assertDatabaseHas('role_permissions', [
            'role_id' => $this->role->id,
            'permission_id' => $this->permission1->id,
        ]);
        $this->assertDatabaseHas('role_permissions', [
            'role_id' => $this->role->id,
            'permission_id' => $this->permission2->id,
        ]);
    }

    public function test_can_explicitly_sync_role_permissions(): void
    {
        $response = $this->putJson("/api/v1/roles/{$this->role->id}/permissions", [
            'permission_ids' => [$this->permission2->id],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('role_permissions', [
            'role_id' => $this->role->id,
            'permission_id' => $this->permission2->id,
        ]);
    }

    public function test_cannot_delete_protected_system_role(): void
    {
        $superAdmin = Role::create([
            'name' => 'Super Administrator',
            'code' => 'SUPER_ADMIN',
            'status_id' => $this->status->id,
        ]);

        $response = $this->deleteJson("/api/v1/roles/{$superAdmin->id}");

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'System protected roles cannot be deleted');
    }

    public function test_can_delete_custom_role(): void
    {
        $response = $this->deleteJson("/api/v1/roles/{$this->role->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('roles', [
            'id' => $this->role->id,
        ]);
    }
}
