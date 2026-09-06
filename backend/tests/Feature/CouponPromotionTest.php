<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Modules\User\Persistence\Models\User;
use App\Modules\Employee\Persistence\Models\Employee;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\Warehouse\Persistence\Models\Warehouse;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\Unit\Persistence\Models\Unit;
use App\Modules\Category\Persistence\Models\Category;
use App\Modules\Inventory\Persistence\Models\Stock;
use App\Modules\Customer\Persistence\Models\Customer;
use App\Modules\Discount\Persistence\Models\Discount;
use App\Modules\Discount\Persistence\Models\Coupon;
use App\Modules\Discount\Persistence\Models\CouponUsage;
use App\Modules\Payment\Persistence\Models\PaymentMethod;
use App\Modules\Settings\Persistence\Models\SysStatus;

class CouponPromotionTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $branch;
    protected $warehouse;
    protected $unit;
    protected $category;
    protected $product;
    protected $paymentMethod;
    protected $customer;
    protected $coupon;

    protected function setUp(): void
    {
        parent::setUp();

        $activeStatus = SysStatus::firstOrCreate(
            ['domain' => 'COMMON', 'code' => 'ACTIVE'],
            ['name' => 'Active']
        );

        $this->branch = Branch::firstOrCreate(
            ['code' => 'BR-CPN-01'],
            ['name' => 'Coupon Branch', 'address' => 'Phnom Penh', 'status_id' => $activeStatus->id]
        );

        $employee = Employee::firstOrCreate(
            ['employee_code' => 'EMP-CPN-01'],
            [
                'branch_id' => $this->branch->id,
                'first_name' => 'Coupon',
                'last_name' => 'Cashier',
                'status_id' => $activeStatus->id,
            ]
        );

        $this->user = User::firstOrCreate(
            ['username' => 'coupon_admin'],
            [
                'employee_id' => $employee->id,
                'password' => bcrypt('secret123'),
                'status_id' => $activeStatus->id,
            ]
        );

        $this->warehouse = Warehouse::firstOrCreate(
            ['code' => 'WH-CPN-01'],
            ['branch_id' => $this->branch->id, 'name' => 'Coupon WH', 'type' => 'RETAIL', 'status_id' => $activeStatus->id]
        );

        $this->unit = Unit::firstOrCreate(
            ['code' => 'PCS-CPN'],
            ['name' => 'Piece', 'symbol' => 'pcs', 'status_id' => $activeStatus->id]
        );

        $this->category = Category::firstOrCreate(
            ['code' => 'CAT-CPN'],
            ['name' => 'Coupon Category', 'status_id' => $activeStatus->id]
        );

        $this->product = Product::firstOrCreate(
            ['sku' => 'SKU-CPN-001'],
            [
                'name' => 'Test Premium Item',
                'category_id' => $this->category->id,
                'unit_id' => $this->unit->id,
                'cost_price' => 20.00,
                'selling_price' => 50.00,
                'tax_rate' => 0.10,
                'status_id' => $activeStatus->id,
            ]
        );

        Stock::updateOrCreate(
            ['warehouse_id' => $this->warehouse->id, 'product_id' => $this->product->id],
            ['quantity' => 100, 'reserved_quantity' => 0, 'available_quantity' => 100, 'status_id' => $activeStatus->id]
        );

        $this->paymentMethod = PaymentMethod::firstOrCreate(
            ['code' => 'CASH-CPN'],
            ['name' => 'Cash', 'type' => 'CASH', 'status_id' => $activeStatus->id]
        );

        $this->customer = Customer::firstOrCreate(
            ['customer_code' => 'CUST-CPN-01', 'phone' => '012999888'],
            ['name' => 'VIP John Doe', 'loyalty_points' => 50, 'status_id' => $activeStatus->id]
        );

        // Seed Discount & Coupon
        $discount = Discount::updateOrCreate(
            ['code' => 'DISC-TEST10'],
            [
                'name' => 'Test 10% Discount',
                'type' => 'PERCENTAGE',
                'value' => 10.0,
                'minimum_amount' => 20.0,
                'maximum_discount' => 25.0,
                'start_at' => now()->subDay(),
                'end_at' => now()->addMonth(),
                'usage_limit' => 50,
                'status_id' => $activeStatus->id,
                'created_by' => $this->user->id,
            ]
        );

        $this->coupon = Coupon::updateOrCreate(
            ['code' => 'TEST10'],
            [
                'discount_id' => $discount->id,
                'start_at' => now()->subDay(),
                'end_at' => now()->addMonth(),
                'usage_limit' => 50,
                'status_id' => $activeStatus->id,
            ]
        );
    }

    public function test_coupon_validation_success(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/v1/coupons/validate', [
            'code' => 'TEST10',
            'subtotal' => 100.00,
        ]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('valid'));
        $this->assertEquals(10.00, $response->json('discount_amount'));
    }

    public function test_coupon_validation_fails_for_minimum_spend(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/v1/coupons/validate', [
            'code' => 'TEST10',
            'subtotal' => 10.00, // minimum spend is 20.00
        ]);

        $response->assertStatus(422);
        $this->assertFalse($response->json('valid'));
        $this->assertStringContainsString('Minimum spend', $response->json('message'));
    }

    public function test_sale_with_coupon_applied(): void
    {
        $initialUsageCount = $this->coupon->usage_count;

        $payload = [
            'branch_id' => $this->branch->id,
            'warehouse_id' => $this->warehouse->id,
            'customer_id' => $this->customer->id,
            'coupon_code' => 'TEST10',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'unit_id' => $this->unit->id,
                    'quantity' => 2,
                    'unit_price' => 50.00, // subtotal = 100.00
                    'discount_amount' => 0,
                    'tax_rate' => 0.10,
                    'tax_amount' => 10.00,
                ],
            ],
            'payment' => [
                'payment_method_id' => $this->paymentMethod->id,
                'amount' => 100.00,
                'currency' => 'USD',
            ],
            'notes' => 'Coupon Test Order',
        ];

        $response = $this->actingAs($this->user)->postJson('/api/v1/sales', $payload);

        $response->assertStatus(201);
        $sale = $response->json('data');

        // Subtotal = 100, 10% coupon = 10.00 discount, Tax = 10.00, Total = 100 - 10 + 10 = 100.00
        $this->assertEquals(10.00, (float)$sale['discount_amount']);
        $this->assertEquals(100.00, (float)$sale['total_amount']);

        // Check coupon usage incremented
        $this->coupon->refresh();
        $this->assertEquals($initialUsageCount + 1, $this->coupon->usage_count);

        // Check coupon usage record created
        $this->assertDatabaseHas('coupon_usages', [
            'coupon_id' => $this->coupon->id,
            'sale_id' => $sale['id'],
        ]);
    }
}
