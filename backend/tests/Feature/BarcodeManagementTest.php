<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Modules\Settings\Persistence\Models\SysStatus;
use App\Modules\Category\Persistence\Models\Category;
use App\Modules\Unit\Persistence\Models\Unit;
use App\Modules\Product\Persistence\Models\Product;

class BarcodeManagementTest extends TestCase
{
    use RefreshDatabase;

    protected $product;

    protected function setUp(): void
    {
        parent::setUp();

        $status = SysStatus::firstOrCreate(
            ['domain' => 'COMMON', 'code' => 'ACTIVE'],
            ['name' => 'Active']
        );

        $category = Category::firstOrCreate(
            ['code' => 'BEV'],
            ['name' => 'Beverages', 'status_id' => $status->id]
        );

        $unit = Unit::firstOrCreate(
            ['code' => 'CAN'],
            ['name' => 'Can', 'symbol' => 'can', 'status_id' => $status->id]
        );

        $this->product = Product::create([
            'sku' => 'BEV-001',
            'barcode' => '8850123456781',
            'name' => 'Angkor Premium Beer 330ml',
            'selling_price' => 1.50,
            'cost_price' => 0.85,
            'category_id' => $category->id,
            'unit_id' => $unit->id,
            'available_quantity' => 100,
            'status_id' => $status->id,
        ]);
    }

    public function test_can_generate_valid_ean13_barcode_with_modulo10_checksum()
    {
        $response = $this->postJson('/api/v1/barcode/generate', [
            'format' => 'EAN_13',
            'prefix' => '200',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'format' => 'EAN_13',
            ]);

        $barcode = $response->json('barcode');
        $this->assertEquals(13, strlen($barcode));
        $this->assertStringStartsWith('200', $barcode);

        // Verify checksum
        $twelve = substr($barcode, 0, 12);
        $expectedCheckDigit = (int) substr($barcode, 12, 1);
        
        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $sum += ((int) $twelve[$i]) * ($i % 2 === 0 ? 1 : 3);
        }
        $rem = $sum % 10;
        $calcCheckDigit = ($rem === 0) ? 0 : (10 - $rem);

        $this->assertEquals($calcCheckDigit, $expectedCheckDigit);
    }

    public function test_can_generate_code128_barcode()
    {
        $response = $this->postJson('/api/v1/barcode/generate', [
            'format' => 'CODE_128',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'format' => 'CODE_128',
            ]);

        $barcode = $response->json('barcode');
        $this->assertStringStartsWith('PRD-', $barcode);
    }

    public function test_can_resolve_existing_product_by_barcode()
    {
        $response = $this->postJson('/api/v1/barcode/resolve', [
            'code' => '8850123456781',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'type' => 'product',
                'matched' => true,
                'entity' => [
                    'id' => $this->product->id,
                    'barcode' => '8850123456781',
                ],
            ]);
    }

    public function test_can_resolve_cheatsheet_service_item()
    {
        $response = $this->postJson('/api/v1/barcode/resolve', [
            'code' => '2900001000105',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'type' => 'service_fee',
                'matched' => true,
                'entity' => [
                    'name' => 'Plastic Carrier Bag',
                ],
            ]);
    }

    public function test_returns_404_for_unregistered_barcode()
    {
        $response = $this->postJson('/api/v1/barcode/resolve', [
            'code' => '9999999999999',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'type' => 'unknown',
                'matched' => false,
            ]);
    }

    public function test_can_assign_barcode_to_product()
    {
        $newBarcode = '2008899112233';

        $response = $this->postJson('/api/v1/barcode/assign', [
            'product_id' => $this->product->id,
            'barcode' => $newBarcode,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'product' => [
                    'id' => $this->product->id,
                    'barcode' => $newBarcode,
                ],
            ]);

        $this->assertDatabaseHas('products', [
            'id' => $this->product->id,
            'barcode' => $newBarcode,
        ]);
    }
}
