<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class EndToEndAPITest extends TestCase
{
    use RefreshDatabase;

    public function test_complete_pos_and_management_api_lifecycle(): void
    {
        // 1. Seed database with default data
        $this->seed();

        // 2. Fetch Products (as POS Terminal does)
        $productsRes = $this->getJson('/api/v1/products');
        $productsRes->assertStatus(200);

        // Create a product and stock for our sale
        $branch = \App\Modules\Organization\Persistence\Models\Branch::first();
        $warehouse = \App\Modules\Warehouse\Persistence\Models\Warehouse::first();
        $unit = \App\Modules\Unit\Persistence\Models\Unit::create([
            'code' => 'BOTTLE',
            'name' => 'Bottle',
            'status_id' => 1,
        ]);
        $product = \App\Modules\Product\Persistence\Models\Product::create([
            'sku' => 'WATER-001',
            'name' => 'Natural Mineral Water',
            'unit_id' => $unit->id,
            'cost_price' => 0.25,
            'selling_price' => 0.50,
            'status_id' => 1,
        ]);
        $stock = \App\Modules\Inventory\Persistence\Models\Stock::create([
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'quantity' => 100,
            'reserved_quantity' => 0,
            'available_quantity' => 100,
        ]);

        // 3. Generate Bakong KHQR for the checkout
        $khqrRes = $this->postJson('/api/v1/payments/khqr/generate', [
            'bill_number' => 'BILL-E2E-001',
            'amount' => 5.0,
            'currency' => 'USD',
        ]);
        $khqrRes->assertStatus(200);
        $khqrRes->assertJsonStructure(['success', 'data' => ['qr_string', 'md5']]);
        $md5 = $khqrRes->json('data.md5');

        // 4. Complete POS Sale with KHQR payment method
        $salePayload = [
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'customer_id' => null,
            'items' => [
                [
                    'product_id' => $product->id,
                    'unit_id' => $unit->id,
                    'quantity' => 10,
                    'unit_price' => 0.50,
                    'discount_amount' => 0,
                    'tax_rate' => 0,
                    'tax_amount' => 0,
                ]
            ],
            'payment' => [
                'payment_method_id' => 2, // KHQR
                'amount' => 5.0,
                'currency' => 'USD',
                'reference_number' => $md5,
            ],
            'notes' => 'E2E Sale Test',
        ];

        $saleRes = $this->postJson('/api/v1/sales', $salePayload);
        $saleRes->assertStatus(201);
        $saleRes->assertJson(['success' => true]);
        $saleId = $saleRes->json('data.id');

        // Verify stock deducted
        $stock->refresh();
        $this->assertEquals(90.0, (float) $stock->quantity);

        // 5. Generate Official Invoice
        $invoiceRes = $this->postJson("/api/v1/invoices/generate-from-sale/{$saleId}");
        $invoiceRes->assertStatus(201);
        $invoiceRes->assertJson(['success' => true]);
        $this->assertStringStartsWith('INV-', $invoiceRes->json('data.invoice_number'));

        // 6. Check Dashboard Metrics
        $dashRes = $this->getJson('/api/v1/dashboard/metrics');
        $dashRes->assertStatus(200);
        $this->assertEquals(1, $dashRes->json('data.today_sales_count'));
        $this->assertEquals(5.0, (float) $dashRes->json('data.today_revenue'));

        // 7. Check Sales History
        $salesListRes = $this->getJson('/api/v1/sales');
        $salesListRes->assertStatus(200);
        $this->assertCount(1, $salesListRes->json('data.data'));

        // 8. Void the Sale and verify inventory restoration
        $voidRes = $this->postJson("/api/v1/returns/sales/{$saleId}/void", [
            'reason' => 'Customer changed mind immediately',
        ]);
        $voidRes->assertStatus(200);

        $stock->refresh();
        $this->assertEquals(100.0, (float) $stock->quantity);
    }
}
