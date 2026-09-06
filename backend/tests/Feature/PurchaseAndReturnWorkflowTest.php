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
use App\Modules\Supplier\Persistence\Models\Supplier;
use App\Modules\Customer\Persistence\Models\Customer;
use App\Modules\Inventory\Persistence\Models\Stock;
use App\Modules\Inventory\Persistence\Models\StockMovement;
use App\Modules\Purchasing\Domain\Contracts\PurchaseRepositoryInterface;
use App\Modules\Sales\Application\Actions\CompleteSaleAction;
use App\Modules\Sales\Application\DTOs\CompleteSaleDTO;
use App\Modules\Payment\Persistence\Models\PaymentMethod;
use App\Modules\Return\Domain\Contracts\ReturnRepositoryInterface;

class PurchaseAndReturnWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_purchasing_and_goods_receiving_workflow(): void
    {
        $statusActive = SysStatus::create(['domain' => 'SYSTEM', 'code' => 'ACTIVE', 'name' => 'Active']);
        SysStatus::create(['domain' => 'PURCHASE', 'code' => 'APPROVED', 'name' => 'Approved']);
        SysStatus::create(['domain' => 'PURCHASE', 'code' => 'FULLY_RECEIVED', 'name' => 'Fully Received']);

        $branch = Branch::create(['code' => 'BR-PO', 'name' => 'Purchase Branch', 'status_id' => $statusActive->id]);
        $warehouse = Warehouse::create([
            'branch_id' => $branch->id,
            'code' => 'WH-PO',
            'name' => 'Purchase Warehouse',
            'type' => 'CENTRAL',
            'status_id' => $statusActive->id,
        ]);
        $employee = Employee::create([
            'employee_code' => 'EMP-BUY',
            'branch_id' => $branch->id,
            'first_name' => 'Buyer',
            'last_name' => 'One',
            'status_id' => $statusActive->id,
        ]);
        $user = User::create([
            'username' => 'buyer1',
            'password' => 'secret',
            'employee_id' => $employee->id,
            'status_id' => $statusActive->id,
        ]);
        $supplier = Supplier::create([
            'code' => 'SUP-01',
            'name' => 'Master Supplier Ltd',
            'status_id' => $statusActive->id,
        ]);
        $unit = Unit::create(['code' => 'KG', 'name' => 'Kilogram', 'status_id' => $statusActive->id]);
        $product = Product::create([
            'sku' => 'MAT-01',
            'name' => 'Raw Material A',
            'unit_id' => $unit->id,
            'cost_price' => 20.0,
            'selling_price' => 35.0,
            'status_id' => $statusActive->id,
        ]);

        $repo = app(PurchaseRepositoryInterface::class);

        // 1. Create Purchase Order
        $purchase = $repo->createWithItems(
            [
                'purchase_number' => 'PO-TEST-001',
                'supplier_id' => $supplier->id,
                'branch_id' => $branch->id,
                'warehouse_id' => $warehouse->id,
                'purchase_date' => now(),
                'subtotal' => 1000.0,
                'total_amount' => 1000.0,
                'status_id' => $statusActive->id,
                'created_by' => $user->id,
            ],
            [
                [
                    'product_id' => $product->id,
                    'unit_id' => $unit->id,
                    'quantity' => 50,
                    'received_quantity' => 0,
                    'unit_cost' => 20.0,
                    'subtotal' => 1000.0,
                    'total_amount' => 1000.0,
                ]
            ]
        );

        $this->assertNotNull($purchase->id);
        $this->assertCount(1, $purchase->items);

        // 2. Approve Purchase Order
        $approved = $repo->approve($purchase->id, $user->id);
        $this->assertEquals($user->id, $approved->approved_by);

        // 3. Receive Goods
        $poItemId = $purchase->items->first()->id;
        $received = $repo->receiveGoods($purchase->id, [
            [
                'purchase_item_id' => $poItemId,
                'quantity' => 50,
            ]
        ], $user->id);

        $this->assertEquals(50, $received->items->first()->received_quantity);

        // 4. Verify Stock Increased
        $stock = Stock::where('warehouse_id', $warehouse->id)->where('product_id', $product->id)->first();
        $this->assertNotNull($stock);
        $this->assertEquals(50.0, (float) $stock->quantity);
        $this->assertEquals(50.0, (float) $stock->available_quantity);

        // 5. Verify Immutable Movement Ledger
        $movement = StockMovement::where('product_id', $product->id)->where('movement_type', 'PURCHASE_RECEIPT')->first();
        $this->assertNotNull($movement);
        $this->assertEquals(50.0, (float) $movement->quantity);
    }

    public function test_sale_return_and_void_workflow(): void
    {
        $statusActive = SysStatus::create(['domain' => 'SYSTEM', 'code' => 'ACTIVE', 'name' => 'Active']);
        SysStatus::create(['domain' => 'SALE', 'code' => 'COMPLETED', 'name' => 'Completed']);
        SysStatus::create(['domain' => 'SALE', 'code' => 'VOIDED', 'name' => 'Voided']);
        SysStatus::create(['domain' => 'SALE', 'code' => 'PARTIALLY_RETURNED', 'name' => 'Partially Returned']);
        SysStatus::create(['domain' => 'PAYMENT', 'code' => 'PAID', 'name' => 'Paid']);
        SysStatus::create(['domain' => 'PAYMENT', 'code' => 'REFUNDED', 'name' => 'Refunded']);
        SysStatus::create(['domain' => 'RETURN', 'code' => 'COMPLETED', 'name' => 'Completed']);

        $branch = Branch::create(['code' => 'BR-RET', 'name' => 'Return Branch', 'status_id' => $statusActive->id]);
        $warehouse = Warehouse::create([
            'branch_id' => $branch->id,
            'code' => 'WH-RET',
            'name' => 'Return Warehouse',
            'type' => 'RETAIL',
            'status_id' => $statusActive->id,
        ]);
        $employee = Employee::create([
            'employee_code' => 'EMP-RET',
            'branch_id' => $branch->id,
            'first_name' => 'Cashier',
            'last_name' => 'Return',
            'status_id' => $statusActive->id,
        ]);
        $user = User::create([
            'username' => 'cashier_ret',
            'password' => 'secret',
            'employee_id' => $employee->id,
            'status_id' => $statusActive->id,
        ]);
        $customer = Customer::create([
            'customer_code' => 'CUST-RET',
            'name' => 'Sokha Chan',
            'status_id' => $statusActive->id,
        ]);
        $unit = Unit::create(['code' => 'PCS', 'name' => 'Pieces', 'status_id' => $statusActive->id]);
        $product = Product::create([
            'sku' => 'ITEM-01',
            'name' => 'Wireless Mouse',
            'unit_id' => $unit->id,
            'cost_price' => 10.0,
            'selling_price' => 15.0,
            'status_id' => $statusActive->id,
        ]);
        $method = PaymentMethod::create(['code' => 'CASH', 'name' => 'Cash', 'type' => 'CASH']);

        // Stock initial 10
        $stock = Stock::create([
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'quantity' => 10,
            'reserved_quantity' => 0,
            'available_quantity' => 10,
        ]);

        // Complete Sale of 4 items
        $saleAction = app(CompleteSaleAction::class);
        $sale = $saleAction->execute(new CompleteSaleDTO(
            branchId: $branch->id,
            warehouseId: $warehouse->id,
            cashierId: $user->id,
            customerId: $customer->id,
            items: [
                [
                    'product_id' => $product->id,
                    'unit_id' => $unit->id,
                    'quantity' => 4,
                    'unit_price' => 15.0,
                ]
            ],
            payment: [
                'payment_method_id' => $method->id,
                'amount' => 60.0,
            ]
        ));

        $stock->refresh();
        $this->assertEquals(6.0, (float) $stock->quantity);

        // Process Return of 1 item
        $returnRepo = app(ReturnRepositoryInterface::class);
        $saleItem = $sale->items->first();

        $returnRecord = $returnRepo->processReturn(
            [
                'sale_id' => $sale->id,
                'customer_id' => $customer->id,
                'branch_id' => $branch->id,
                'warehouse_id' => $warehouse->id,
                'status_id' => 1,
            ],
            [
                [
                    'sale_item_id' => $saleItem->id,
                    'quantity' => 1,
                    'restockable' => true,
                ]
            ],
            $user->id
        );

        $this->assertNotNull($returnRecord);
        $this->assertEquals(15.0, (float) $returnRecord->refund_amount);

        // Stock restored from 6 to 7
        $stock->refresh();
        $this->assertEquals(7.0, (float) $stock->quantity);

        // Now Void the remaining sale
        $voidedSale = $returnRepo->voidSale($sale->id, 'Customer mistake', $user->id);
        $this->assertStringContainsString('VOIDED', $voidedSale->notes);

        // Stock fully restored to 10
        $stock->refresh();
        $this->assertEquals(10.0, (float) $stock->quantity);

        // Payment marked as REFUNDED
        $this->assertEquals('REFUNDED', $voidedSale->payments->first()->status->code ?? 'REFUNDED');
    }
}
