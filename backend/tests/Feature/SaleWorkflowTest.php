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
use App\Modules\Payment\Persistence\Models\PaymentMethod;
use App\Modules\Sales\Application\Actions\CompleteSaleAction;
use App\Modules\Sales\Application\DTOs\CompleteSaleDTO;
use App\Modules\Sales\Domain\Exceptions\InsufficientStockException;
use Illuminate\Support\Facades\Event;
use App\Modules\Sales\Domain\Events\SaleCompletedEvent;

class SaleWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_sale_requires_sufficient_stock(): void
    {
        // Setup base data
        $status = SysStatus::create(['domain' => 'SYSTEM', 'code' => 'ACTIVE', 'name' => 'Active']);
        $branch = Branch::create(['code' => 'BR01', 'name' => 'Main Branch', 'status_id' => $status->id]);
        $employee = Employee::create([
            'employee_code' => 'EMP01',
            'branch_id' => $branch->id,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'status_id' => $status->id,
        ]);
        $user = User::create([
            'username' => 'cashier1',
            'password' => 'secret',
            'employee_id' => $employee->id,
            'status_id' => $status->id,
        ]);
        $warehouse = Warehouse::create([
            'branch_id' => $branch->id,
            'code' => 'WH01',
            'name' => 'Main Warehouse',
            'type' => 'RETAIL',
            'status_id' => $status->id,
        ]);
        $unit = Unit::create(['code' => 'PCS', 'name' => 'Pieces', 'status_id' => $status->id]);
        $product = Product::create([
            'sku' => 'PROD-001',
            'name' => 'Test Product',
            'unit_id' => $unit->id,
            'cost_price' => 5.0,
            'selling_price' => 10.0,
            'status_id' => $status->id,
        ]);
        $method = PaymentMethod::create(['code' => 'CASH', 'name' => 'Cash', 'type' => 'CASH']);

        // Set available stock to 5
        Stock::create([
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'quantity' => 5,
            'reserved_quantity' => 0,
            'available_quantity' => 5,
        ]);

        $action = app(CompleteSaleAction::class);

        // Attempt to sell 10 items when only 5 are in stock
        $this->expectException(InsufficientStockException::class);

        $action->execute(new CompleteSaleDTO(
            branchId: $branch->id,
            warehouseId: $warehouse->id,
            cashierId: $user->id,
            customerId: null,
            items: [
                [
                    'product_id' => $product->id,
                    'unit_id' => $unit->id,
                    'quantity' => 10,
                    'unit_price' => 10.0,
                ]
            ],
            payment: [
                'payment_method_id' => $method->id,
                'amount' => 100.0,
            ]
        ));
    }

    public function test_sale_completes_and_deducts_stock_and_fires_event(): void
    {
        Event::fake([SaleCompletedEvent::class]);

        $statusActive = SysStatus::create(['domain' => 'SYSTEM', 'code' => 'ACTIVE', 'name' => 'Active']);
        SysStatus::create(['domain' => 'SALE', 'code' => 'COMPLETED', 'name' => 'Completed']);
        SysStatus::create(['domain' => 'PAYMENT', 'code' => 'PAID', 'name' => 'Paid']);

        $branch = Branch::create(['code' => 'BR02', 'name' => 'Second Branch', 'status_id' => $statusActive->id]);
        $employee = Employee::create([
            'employee_code' => 'EMP02',
            'branch_id' => $branch->id,
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'status_id' => $statusActive->id,
        ]);
        $user = User::create([
            'username' => 'cashier2',
            'password' => 'secret',
            'employee_id' => $employee->id,
            'status_id' => $statusActive->id,
        ]);
        $warehouse = Warehouse::create([
            'branch_id' => $branch->id,
            'code' => 'WH02',
            'name' => 'Retail Warehouse',
            'type' => 'RETAIL',
            'status_id' => $statusActive->id,
        ]);
        $unit = Unit::create(['code' => 'BOX', 'name' => 'Box', 'status_id' => $statusActive->id]);
        $product = Product::create([
            'sku' => 'PROD-002',
            'name' => 'Energy Drink',
            'unit_id' => $unit->id,
            'cost_price' => 1.5,
            'selling_price' => 2.5,
            'status_id' => $statusActive->id,
        ]);
        $method = PaymentMethod::create(['code' => 'KHQR', 'name' => 'Bakong KHQR', 'type' => 'KHQR']);

        $stock = Stock::create([
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'quantity' => 20,
            'reserved_quantity' => 0,
            'available_quantity' => 20,
        ]);

        $action = app(CompleteSaleAction::class);

        $sale = $action->execute(new CompleteSaleDTO(
            branchId: $branch->id,
            warehouseId: $warehouse->id,
            cashierId: $user->id,
            customerId: null,
            items: [
                [
                    'product_id' => $product->id,
                    'unit_id' => $unit->id,
                    'quantity' => 4,
                    'unit_price' => 2.5,
                ]
            ],
            payment: [
                'payment_method_id' => $method->id,
                'amount' => 10.0,
            ]
        ));

        $this->assertNotNull($sale);
        $this->assertEquals(10.0, (float) $sale->total_amount);

        // Verify stock deducted
        $stock->refresh();
        $this->assertEquals(16.0, (float) $stock->quantity);
        $this->assertEquals(16.0, (float) $stock->available_quantity);

        // Verify event fired
        Event::assertDispatched(SaleCompletedEvent::class);
    }
}
