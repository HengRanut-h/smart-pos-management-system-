<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;

class SettingsManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_system_settings(): void
    {
        $response = $this->getJson('/api/v1/settings');

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));
        $this->assertNotNull($response->json('data.store_name'));
    }

    public function test_update_system_settings(): void
    {
        $payload = [
            'store_name' => 'SmartPOS Flagship Phnom Penh',
            'branch_code' => 'HQ-PP-01',
            'phone_number' => '+855 12 000 111',
        ];

        $response = $this->postJson('/api/v1/settings', $payload);

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));
        $this->assertEquals('SmartPOS Flagship Phnom Penh', $response->json('data.store_name'));
        $this->assertEquals('HQ-PP-01', $response->json('data.branch_code'));
    }

    public function test_upload_store_logo(): void
    {
        $file = UploadedFile::fake()->image('store_logo.png', 500, 500);

        $response = $this->postJson('/api/v1/settings/upload-logo', [
            'image' => $file,
        ]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));
        $this->assertNotNull($response->json('store_logo_url'));
        $this->assertNotNull($response->json('relative_url'));
    }
}
