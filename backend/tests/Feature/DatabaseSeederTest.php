<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Modules\Role\Persistence\Models\Role;
use App\Modules\Permission\Persistence\Models\Permission;
use App\Modules\User\Persistence\Models\User;
use App\Modules\Organization\Persistence\Models\Branch;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_populates_foundation_records(): void
    {
        $this->seed();

        // 1. Verify Roles Seeded
        $this->assertEquals(8, Role::count());
        $this->assertDatabaseHas('roles', ['code' => 'SUPER_ADMIN']);
        $this->assertDatabaseHas('roles', ['code' => 'CASHIER']);

        // 2. Verify Permissions Seeded & Attached
        $this->assertGreaterThan(10, Permission::count());
        $superAdmin = Role::where('code', 'SUPER_ADMIN')->first();
        $this->assertGreaterThan(10, $superAdmin->permissions()->count());

        // 3. Verify Branch & Super Admin User Seeded
        $this->assertDatabaseHas('branches', ['code' => 'HQ-01']);
        $admin = User::where('username', 'admin')->first();
        $this->assertNotNull($admin);
        $this->assertTrue($admin->roles->contains('code', 'SUPER_ADMIN'));
    }
}
