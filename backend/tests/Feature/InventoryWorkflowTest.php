<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Modules\Settings\Persistence\Models\SysStatus;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\Warehouse\Persistence\Models\Warehouse;
use App\Modules\Employee\Persistence\Models\Employee;
use App\Modules\User\Persistence\Models\User;
use App\Modules\Unit\Persistence\Models\Unit;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\Inventory\Persistence\Models\Stock;
use App\Modules\Inventory\Persistence\Models\StockMovement;
use App\Modules\Inventory\Persistence\Models\StockAdjustment;
use App\Modules\Inventory\Persistence\Models\StockTransfer;

class InventoryWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private $user;
    private $warehouse1;
    private $warehouse2;
    private $product;

    protected function setUp(): void
    {
        parent::setUp();

        $status = SysStatus::create(['domain' => 'SYSTEM', 'code' => 'ACTIVE', 'name' => 'Active']);
        SysStatus::create(['domain' => 'SYSTEM', 'code' => 'COMPLETED', 'name' => 'Completed']);

        $branch = Branch::create(['code' => 'BR01', 'name' => 'Main Branch', 'status_id' => $status->id]);
        $employee = Employee::create([
            'employee_code' => 'EMP01',
            'branch_id' => $branch->id,
            'first_name' => 'Alice',
            'last_name' => 'Inventory',
            'status_id' => $status->id,
        ]);
        $this->user = User::create([
            'username' => 'inventory_mgr',
            'password' => 'secret',
            'employee_id' => $employee->id,
            'status_id' => $status->id,
        ]);

        $this->warehouse1 = Warehouse::create([
            'branch_id' => $branch->id,
            'code' => 'WH01',
            'name' => 'Main Warehouse',
            'type' => 'CENTRAL',
            'status_id' => $status->id,
        ]);

        $this->warehouse2 = Warehouse::create([
            'branch_id' => $branch->id,
            'code' => 'WH02',
            'name' => 'Storefront Warehouse',
            'type' => 'RETAIL',
            'status_id' => $status->id,
        ]);

        $unit = Unit::create(['code' => 'PCS', 'name' => 'Pieces', 'status_id' => $status->id]);
        $this->product = Product::create([
            'sku' => 'TEST-STOCK-01',
            'barcode' => '884123456789',
            'name' => 'Test Inventory Item',
            'unit_id' => $unit->id,
            'cost_price' => 10.0,
            'selling_price' => 18.0,
            'alert_quantity' => 5,
            'status_id' => $status->id,
        ]);
    }

    public function test_stock_adjustment_increase_and_decrease(): void
    {
        // 1. Initial stock adjustment (increase by 20)
        $response = $this->actingAs($this->user)->postJson('/api/v1/inventory/adjust', [
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
            'quantity' => 20.0,
            'type' => 'INCREASE',
            'reason' => 'Initial physical audit count',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'type' => 'INCREASE',
                    'quantity' => 20.0,
                    'after_quantity' => 20.0,
                ]
            ]);

        $stock = Stock::where('warehouse_id', $this->warehouse1->id)
            ->where('product_id', $this->product->id)
            ->first();
        $this->assertEquals(20.0, (float)$stock->quantity);
        $this->assertEquals(20.0, (float)$stock->available_quantity);

        // Verify movement in stock_movements
        $this->assertDatabaseHas('stock_movements', [
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
            'movement_type' => 'ADJUSTMENT_INCREASE',
            'quantity' => 20.0,
        ]);

        // 2. Decrease adjustment (shrinkage down by 2)
        $response2 = $this->actingAs($this->user)->postJson('/api/v1/inventory/adjust', [
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
            'quantity' => 2.0,
            'type' => 'DECREASE',
            'reason' => 'Found 2 damaged items during count',
        ]);

        $response2->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'type' => 'DECREASE',
                    'quantity' => 2.0,
                    'after_quantity' => 18.0,
                ]
            ]);

        $stock->refresh();
        $this->assertEquals(18.0, (float)$stock->quantity);
        $this->assertEquals(18.0, (float)$stock->available_quantity);

        $this->assertDatabaseHas('stock_movements', [
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
            'movement_type' => 'ADJUSTMENT_DECREASE',
            'quantity' => -2.0,
        ]);
    }

    public function test_stock_transfer_between_warehouses(): void
    {
        // Give warehouse 1 50 items
        Stock::create([
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
            'quantity' => 50.0,
            'reserved_quantity' => 0.0,
            'available_quantity' => 50.0,
        ]);

        // Transfer 15 items to warehouse 2
        $response = $this->actingAs($this->user)->postJson('/api/v1/inventory/transfer', [
            'from_warehouse_id' => $this->warehouse1->id,
            'to_warehouse_id' => $this->warehouse2->id,
            'product_id' => $this->product->id,
            'quantity' => 15.0,
            'notes' => 'Replenishing retail storefront shelf',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'quantity' => 15.0,
                ]
            ]);

        // Check balances
        $stock1 = Stock::where('warehouse_id', $this->warehouse1->id)
            ->where('product_id', $this->product->id)
            ->first();
        $stock2 = Stock::where('warehouse_id', $this->warehouse2->id)
            ->where('product_id', $this->product->id)
            ->first();

        $this->assertEquals(35.0, (float)$stock1->quantity);
        $this->assertEquals(35.0, (float)$stock1->available_quantity);
        $this->assertEquals(15.0, (float)$stock2->quantity);
        $this->assertEquals(15.0, (float)$stock2->available_quantity);

        // Verify two stock movements: TRANSFER_OUT (-15) and TRANSFER_IN (+15)
        $this->assertDatabaseHas('stock_movements', [
            'warehouse_id' => $this->warehouse1->id,
            'movement_type' => 'TRANSFER_OUT',
            'quantity' => -15.0,
        ]);

        $this->assertDatabaseHas('stock_movements', [
            'warehouse_id' => $this->warehouse2->id,
            'movement_type' => 'TRANSFER_IN',
            'quantity' => 15.0,
        ]);
    }

    public function test_inventory_query_and_alerts(): void
    {
        // Seed stock at 3 (below alert_quantity 5)
        Stock::create([
            'warehouse_id' => $this->warehouse1->id,
            'product_id' => $this->product->id,
            'quantity' => 3.0,
            'reserved_quantity' => 0.0,
            'available_quantity' => 3.0,
            'reorder_level' => 5.0,
        ]);

        // 1. Get stocks list
        $stocksRes = $this->actingAs($this->user)->getJson('/api/v1/inventory/stocks');
        $stocksRes->assertStatus(200)
            ->assertJson(['success' => true]);
        $this->assertEquals(1, $stocksRes->json('data.total'));

        // 2. Get low stock alerts
        $alertsRes = $this->actingAs($this->user)->getJson('/api/v1/inventory/alerts');
        $alertsRes->assertStatus(200)
            ->assertJson(['success' => true]);
        $this->assertCount(1, $alertsRes->json('data'));
        $this->assertEquals('TEST-STOCK-01', $alertsRes->json('data.0.product.sku'));
    }
}
