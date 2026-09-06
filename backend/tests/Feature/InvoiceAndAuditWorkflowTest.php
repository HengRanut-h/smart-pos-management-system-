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
use App\Modules\Invoice\Application\Actions\GenerateInvoiceAction;
use App\Modules\Audit\Persistence\Models\AuditLog;

class InvoiceAndAuditWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_sale_automatically_creates_audit_log_and_generates_invoice(): void
    {
        $statusActive = SysStatus::create(['domain' => 'SYSTEM', 'code' => 'ACTIVE', 'name' => 'Active']);
        SysStatus::create(['domain' => 'SALE', 'code' => 'COMPLETED', 'name' => 'Completed']);
        SysStatus::create(['domain' => 'PAYMENT', 'code' => 'PAID', 'name' => 'Paid']);
        SysStatus::create(['domain' => 'INVOICE', 'code' => 'ISSUED', 'name' => 'Issued']);

        $branch = Branch::create(['code' => 'BR-INV', 'name' => 'Invoice Branch', 'status_id' => $statusActive->id]);
        $warehouse = Warehouse::create([
            'branch_id' => $branch->id,
            'code' => 'WH-INV',
            'name' => 'Invoice Warehouse',
            'type' => 'RETAIL',
            'status_id' => $statusActive->id,
        ]);
        $employee = Employee::create([
            'employee_code' => 'EMP-INV',
            'branch_id' => $branch->id,
            'first_name' => 'Cashier',
            'last_name' => 'Invoice',
            'status_id' => $statusActive->id,
        ]);
        $user = User::create([
            'username' => 'cashier_inv',
            'password' => 'secret',
            'employee_id' => $employee->id,
            'status_id' => $statusActive->id,
        ]);
        $unit = Unit::create(['code' => 'PCS', 'name' => 'Pieces', 'status_id' => $statusActive->id]);
        $product = Product::create([
            'sku' => 'LAPTOP-01',
            'name' => 'Business Laptop',
            'unit_id' => $unit->id,
            'cost_price' => 500.0,
            'selling_price' => 800.0,
            'status_id' => $statusActive->id,
        ]);
        $method = PaymentMethod::create(['code' => 'CASH', 'name' => 'Cash', 'type' => 'CASH']);

        Stock::create([
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'quantity' => 10,
            'reserved_quantity' => 0,
            'available_quantity' => 10,
        ]);

        // 1. Complete Sale
        $saleAction = app(CompleteSaleAction::class);
        $sale = $saleAction->execute(new CompleteSaleDTO(
            branchId: $branch->id,
            warehouseId: $warehouse->id,
            cashierId: $user->id,
            customerId: null,
            items: [
                [
                    'product_id' => $product->id,
                    'unit_id' => $unit->id,
                    'quantity' => 2,
                    'unit_price' => 800.0,
                ]
            ],
            payment: [
                'payment_method_id' => $method->id,
                'amount' => 1600.0,
            ]
        ));

        // 2. Verify Audit Log was automatically written by AuditSubscriber
        $audit = AuditLog::where('entity_type', 'Sale')->where('entity_id', $sale->id)->first();
        $this->assertNotNull($audit);
        $this->assertEquals('CREATE', $audit->action);
        $this->assertEquals($user->id, $audit->user_id);

        // 3. Generate Official Invoice
        $invoiceAction = app(GenerateInvoiceAction::class);
        $invoice = $invoiceAction->execute($sale->id, $user->id);

        $this->assertNotNull($invoice);
        $this->assertStringStartsWith('INV-', $invoice->invoice_number);
        $this->assertEquals(1600.0, (float) $invoice->total_amount);
        $this->assertEquals(0.0, (float) $invoice->balance_amount);
        $this->assertCount(1, $invoice->items);

        // 4. Test Dashboard Metrics API
        $response = $this->getJson('/api/v1/dashboard/metrics');
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'today_sales_count' => 1,
                'today_revenue' => 1600.0,
            ]
        ]);
    }
}
