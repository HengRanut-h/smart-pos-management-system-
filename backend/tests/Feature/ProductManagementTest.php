<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\Category\Persistence\Models\Category;
use App\Modules\Unit\Persistence\Models\Unit;
use App\Modules\Settings\Persistence\Models\SysStatus;
use App\Modules\Warehouse\Persistence\Models\Warehouse;
use App\Modules\Organization\Persistence\Models\Branch;

class ProductManagementTest extends TestCase
{
    use RefreshDatabase;

    protected $status;
    protected $category;
    protected $unit;
    protected $branch;
    protected $warehouse;

    protected function setUp(): void
    {
        parent::setUp();

        $this->status = SysStatus::firstOrCreate(
            ['domain' => 'COMMON', 'code' => 'ACTIVE'],
            ['name' => 'Active']
        );

        $this->branch = Branch::firstOrCreate(
            ['code' => 'BR-TEST-01'],
            ['name' => 'Main Branch', 'status_id' => $this->status->id]
        );

        $this->category = Category::firstOrCreate(
            ['code' => 'CAT-TEST'],
            ['name' => 'Beverages', 'status_id' => $this->status->id, 'is_active' => true]
        );

        $this->unit = Unit::firstOrCreate(
            ['code' => 'PCS'],
            ['name' => 'Piece', 'symbol' => 'pcs', 'status_id' => $this->status->id, 'is_base_unit' => true]
        );

        $this->warehouse = Warehouse::firstOrCreate(
            ['code' => 'WH-MAIN'],
            ['name' => 'Main Warehouse', 'branch_id' => $this->branch->id, 'type' => 'CENTRAL', 'status_id' => $this->status->id]
        );
    }

    public function test_get_products_list(): void
    {
        Product::create([
            'sku' => 'SKU-001',
            'barcode' => '8850123456789',
            'name' => 'Iced Latte',
            'category_id' => $this->category->id,
            'unit_id' => $this->unit->id,
            'cost_price' => 1.25,
            'selling_price' => 2.50,
            'tax_rate' => 10.0,
            'status_id' => $this->status->id,
        ]);

        $response = $this->getJson('/api/v1/products');

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));
        $data = $response->json('data.data');
        $this->assertNotEmpty($data);
        $this->assertEquals('Iced Latte', $data[0]['name']);
        $this->assertArrayHasKey('available_quantity', $data[0]);
    }

    public function test_create_product_with_initial_stock(): void
    {
        $payload = [
            'sku' => 'SKU-NEW-999',
            'barcode' => '8859990001112',
            'name' => 'Caramel Macchiato',
            'category_id' => $this->category->id,
            'unit_id' => $this->unit->id,
            'cost_price' => 1.80,
            'selling_price' => 3.50,
            'tax_rate' => 10.0,
            'image_url' => 'https://images.unsplash.com/photo-1541167760496-1628856ab772',
            'initial_stock' => 75,
        ];

        $response = $this->postJson('/api/v1/products', $payload);

        $response->assertStatus(201);
        $this->assertTrue($response->json('success'));
        $productData = $response->json('data');
        $this->assertEquals('Caramel Macchiato', $productData['name']);
        $this->assertEquals(75.0, (float) $productData['available_quantity']);

        $this->assertDatabaseHas('products', [
            'sku' => 'SKU-NEW-999',
            'name' => 'Caramel Macchiato',
        ]);

        $this->assertDatabaseHas('stocks', [
            'product_id' => $productData['id'],
            'quantity' => 75.0,
        ]);
    }

    public function test_update_product_and_stock(): void
    {
        $product = Product::create([
            'sku' => 'SKU-EDIT-1',
            'barcode' => '885000000001',
            'name' => 'Original Name',
            'category_id' => $this->category->id,
            'unit_id' => $this->unit->id,
            'cost_price' => 1.00,
            'selling_price' => 2.00,
            'status_id' => $this->status->id,
        ]);

        $payload = [
            'name' => 'Updated Drink Name',
            'selling_price' => 2.75,
            'available_quantity' => 120,
        ];

        $response = $this->putJson("/api/v1/products/{$product->id}", $payload);

        $response->assertStatus(200);
        $this->assertEquals('Updated Drink Name', $response->json('data.name'));
        $this->assertEquals(2.75, (float) $response->json('data.selling_price'));
        $this->assertEquals(120.0, (float) $response->json('data.available_quantity'));
    }

    public function test_delete_product(): void
    {
        $product = Product::create([
            'sku' => 'SKU-DEL-1',
            'name' => 'Discontinued Item',
            'unit_id' => $this->unit->id,
            'cost_price' => 1.00,
            'selling_price' => 2.00,
            'status_id' => $this->status->id,
        ]);

        $response = $this->deleteJson("/api/v1/products/{$product->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    public function test_categories_and_units_endpoints(): void
    {
        $catRes = $this->getJson('/api/v1/categories');
        $catRes->assertStatus(200);
        $this->assertNotEmpty($catRes->json('data'));

        $unitRes = $this->getJson('/api/v1/units');
        $unitRes->assertStatus(200);
        $this->assertNotEmpty($unitRes->json('data'));
    }
}
