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
use App\Modules\Customer\Persistence\Models\Customer;

class CustomerLoyaltyTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_redeems_and_earns_loyalty_points_at_checkout(): void
    {
        $statusActive = SysStatus::create(['domain' => 'SYSTEM', 'code' => 'ACTIVE', 'name' => 'Active']);
        SysStatus::create(['domain' => 'SALE', 'code' => 'COMPLETED', 'name' => 'Completed']);
        SysStatus::create(['domain' => 'PAYMENT', 'code' => 'PAID', 'name' => 'Paid']);

        $branch = Branch::create(['code' => 'BR-LOYAL', 'name' => 'Loyalty Branch', 'status_id' => $statusActive->id]);
        $employee = Employee::create([
            'employee_code' => 'EMP-LOYAL',
            'branch_id' => $branch->id,
            'first_name' => 'Cashier',
            'last_name' => 'Loyal',
            'status_id' => $statusActive->id,
        ]);
        $user = User::create([
            'username' => 'cashier_loyal',
            'password' => 'secret',
            'employee_id' => $employee->id,
            'status_id' => $statusActive->id,
        ]);

        $warehouse = Warehouse::create([
            'branch_id' => $branch->id,
            'code' => 'WH-LOYAL',
            'name' => 'Loyalty Warehouse',
            'type' => 'RETAIL',
            'status_id' => $statusActive->id,
        ]);

        $unit = Unit::create(['code' => 'PCS', 'name' => 'Pieces', 'symbol' => 'pcs', 'status_id' => $statusActive->id]);
        $product = Product::create([
            'sku' => 'LOYAL-001',
            'name' => 'Loyalty Product',
            'unit_id' => $unit->id,
            'cost_price' => 5.0,
            'selling_price' => 10.0,
            'tax_rate' => 0.1,
            'status_id' => $statusActive->id,
        ]);

        Stock::create([
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'quantity' => 50,
            'reserved_quantity' => 0,
            'available_quantity' => 50,
            'status_id' => $statusActive->id,
        ]);

        $payMethod = PaymentMethod::create(['code' => 'CASH', 'name' => 'Cash USD', 'type' => 'CASH', 'status_id' => $statusActive->id]);

        $customer = Customer::create([
            'customer_code' => 'CUST-LOYAL-1',
            'name' => 'Loyal Shopper',
            'phone' => '012 333 444',
            'loyalty_points' => 200.0,
            'status_id' => $statusActive->id,
        ]);

        $payload = [
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'customer_id' => $customer->id,
            'points_redeemed' => 100,
            'items' => [
                [
                    'product_id' => $product->id,
                    'unit_id' => $unit->id,
                    'quantity' => 1,
                    'unit_price' => 10.0,
                    'tax_rate' => 0.1,
                    'tax_amount' => 1.0,
                ],
            ],
            'payment' => [
                'payment_method_id' => $payMethod->id,
                'amount' => 10.0,
                'currency' => 'USD',
            ],
        ];

        $response = $this->actingAs($user)->postJson('/api/v1/sales', $payload);
        $response->assertStatus(201);
        $response->assertJson(['success' => true]);

        // Verify discount applied on sale
        $this->assertDatabaseHas('sales', [
            'customer_id' => $customer->id,
            'discount_amount' => 1.0,
            'total_amount' => 10.0,
        ]);

        // Verify customer points: started 200, redeemed 100, earned floor(10.00) = 10 -> balance = 110
        $customer->refresh();
        $this->assertEquals(110.0, (float) $customer->loyalty_points);
    }
}
