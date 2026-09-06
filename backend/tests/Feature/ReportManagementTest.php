<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Modules\Settings\Persistence\Models\SysStatus;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\Category\Persistence\Models\Category;
use App\Modules\Unit\Persistence\Models\Unit;
use App\Modules\Sales\Persistence\Models\Sale;
use App\Modules\Sales\Persistence\Models\SaleItem;
use App\Modules\Warehouse\Persistence\Models\Warehouse;

class ReportManagementTest extends TestCase
{
    use RefreshDatabase;

    protected $status;
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
            ['code' => 'HQ-01'],
            ['name' => 'Phnom Penh Headquarters', 'status_id' => $this->status->id]
        );

        $this->warehouse = Warehouse::firstOrCreate(
            ['code' => 'WH-01'],
            ['name' => 'Main Warehouse', 'type' => 'PHYSICAL', 'branch_id' => $this->branch->id, 'status_id' => $this->status->id]
        );
    }

    public function test_get_reports_summary_returns_successful_structure(): void
    {
        $response = $this->getJson('/api/v1/reports/summary?preset=this_month');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'period' => ['preset', 'start_date', 'end_date', 'formatted'],
                'summary' => [
                    'total_orders',
                    'subtotal',
                    'total_discounts',
                    'total_vat_tax',
                    'net_sales',
                    'cogs',
                    'gross_profit',
                    'gross_margin_pct',
                    'average_basket',
                ],
                'tenders' => ['cash', 'khqr', 'card', 'total'],
                'top_products',
                'cashiers',
                'tax_statement' => [
                    'taxable_amount',
                    'vat_rate_pct',
                    'vat_collected',
                    'total_invoiced',
                    'currency',
                    'riel_equivalent',
                ],
            ]);
    }

    public function test_get_reports_summary_with_custom_date_range(): void
    {
        $response = $this->getJson('/api/v1/reports/summary?start_date=2026-01-01&end_date=2026-12-31');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }
}
