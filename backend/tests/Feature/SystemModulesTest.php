<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Modules\Settings\Persistence\Models\SysStatus;

class SystemModulesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        SysStatus::create(['domain' => 'SYSTEM', 'code' => 'ACTIVE', 'name' => 'Active']);
    }

    public function test_can_list_customers_and_create_customer(): void
    {
        $response = $this->getJson('/api/v1/customers');
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        $createResponse = $this->postJson('/api/v1/customers', [
            'name' => 'Kosal Rin',
            'phone' => '012 999 888',
            'email' => 'kosal.rin@test.com',
            'address' => 'Phnom Penh',
        ]);
        $createResponse->assertStatus(201);
        $createResponse->assertJson(['success' => true]);
        $this->assertDatabaseHas('customers', ['name' => 'Kosal Rin']);
    }

    public function test_can_fetch_and_manage_notifications(): void
    {
        $response = $this->getJson('/api/v1/notifications');
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        $markResponse = $this->postJson('/api/v1/notifications/mark-all-read');
        $markResponse->assertStatus(200);
        $markResponse->assertJson(['success' => true]);
    }

    public function test_can_fetch_audit_logs(): void
    {
        $response = $this->getJson('/api/v1/audit-logs');
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
    }

    public function test_can_fetch_and_create_backup(): void
    {
        $statusResponse = $this->getJson('/api/v1/backup/status');
        $statusResponse->assertStatus(200);
        $statusResponse->assertJson(['success' => true]);

        $createResponse = $this->postJson('/api/v1/backup/create');
        $createResponse->assertStatus(200);
        $createResponse->assertJson(['success' => true]);
    }

    public function test_can_get_and_update_settings(): void
    {
        $getResponse = $this->getJson('/api/v1/settings');
        $getResponse->assertStatus(200);
        $getResponse->assertJson(['success' => true]);

        $updateResponse = $this->postJson('/api/v1/settings', [
            'exchange_rate' => 4150.0,
            'branch_code' => 'HQ-01-MAIN',
        ]);
        $updateResponse->assertStatus(200);
        $updateResponse->assertJson(['success' => true]);
        $this->assertEquals(4150.0, $updateResponse->json('data.exchange_rate'));
    }
}
