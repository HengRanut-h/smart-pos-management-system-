<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\Product\Persistence\Models\ProductVariant;
use App\Modules\Product\Persistence\Models\ProductAttribute;
use App\Modules\Product\Persistence\Models\ProductAttributeValue;
use App\Modules\Product\Persistence\Models\UnitConversion;
use App\Modules\Product\Persistence\Models\ProductPriceRule;
use App\Modules\Product\Persistence\Models\ProductWarehouseLocation;
use App\Modules\Product\Persistence\Models\ProductSupplier;
use App\Modules\Product\Persistence\Models\ProductBundle;
use App\Modules\Product\Persistence\Models\ProductBom;
use App\Modules\Product\Persistence\Models\ProductBatch;
use App\Modules\Product\Persistence\Models\ProductSerialNumber;
use App\Modules\Product\Persistence\Models\ProductWarranty;
use App\Modules\Product\Persistence\Models\ProductQcInspection;
use App\Modules\Product\Persistence\Models\ProductReview;
use App\Modules\Product\Persistence\Models\ProductTemplate;
use App\Modules\Category\Persistence\Models\Category;
use App\Modules\Brand\Persistence\Models\Brand;
use App\Modules\Unit\Persistence\Models\Unit;
use App\Modules\Supplier\Persistence\Models\Supplier;
use App\Modules\Warehouse\Persistence\Models\Warehouse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ProductEnterpriseSeeder extends Seeder
{
    public function run(): void
    {
        $cat = Category::first();
        $brand = Brand::first();
        $unit = Unit::first();
        $supplier = Supplier::first();
        $warehouse = Warehouse::first();

        // 1. Seed Unit Conversions
        $boxUnit = Unit::where('name', 'Box')->orWhere('code', 'BOX')->first() ?: $unit;
        $pieceUnit = Unit::where('name', 'Piece')->orWhere('code', 'PCS')->first() ?: $unit;
        $cartonUnit = Unit::where('name', 'Carton')->orWhere('code', 'CTN')->first() ?: $unit;

        if ($cartonUnit && $boxUnit && $cartonUnit->id !== $boxUnit->id) {
            UnitConversion::firstOrCreate(
                ['from_unit_id' => $cartonUnit->id, 'to_unit_id' => $boxUnit->id],
                ['multiplier' => 24, 'description' => '1 Carton = 24 Boxes', 'is_active' => true]
            );
        }

        if ($boxUnit && $pieceUnit && $boxUnit->id !== $pieceUnit->id) {
            UnitConversion::firstOrCreate(
                ['from_unit_id' => $boxUnit->id, 'to_unit_id' => $pieceUnit->id],
                ['multiplier' => 12, 'description' => '1 Box = 12 Pieces', 'is_active' => true]
            );
        }

        // 2. Seed Dynamic Category Attributes
        if ($cat) {
            $attrSize = ProductAttribute::firstOrCreate(
                ['code' => 'SIZE'],
                [
                    'category_id' => $cat->id,
                    'name' => 'Size',
                    'type' => 'SELECT',
                    'options' => ['S', 'M', 'L', 'XL', 'XXL'],
                    'is_required' => false,
                    'is_filterable' => true,
                    'sort_order' => 1,
                ]
            );

            $attrColor = ProductAttribute::firstOrCreate(
                ['code' => 'COLOR'],
                [
                    'category_id' => $cat->id,
                    'name' => 'Color',
                    'type' => 'SELECT',
                    'options' => ['Black', 'White', 'Navy Blue', 'Crimson Red', 'Space Gray'],
                    'is_required' => false,
                    'is_filterable' => true,
                    'sort_order' => 2,
                ]
            );

            $attrStorage = ProductAttribute::firstOrCreate(
                ['code' => 'STORAGE'],
                [
                    'category_id' => $cat->id,
                    'name' => 'Storage Capacity',
                    'type' => 'SELECT',
                    'options' => ['128GB', '256GB', '512GB', '1TB'],
                    'is_required' => false,
                    'is_filterable' => true,
                    'sort_order' => 3,
                ]
            );
        }

        // 3. Seed Variable Product: SmartPOS Premium Polo T-Shirt
        $polo = Product::firstOrCreate(
            ['sku' => 'APP-POLO-001'],
            [
                'name' => 'SmartPOS Premium Embroidered Polo Shirt',
                'barcode' => '885123499011',
                'product_type' => 'VARIABLE',
                'product_code' => 'POLO-2026',
                'category_id' => $cat?->id,
                'brand_id' => $brand?->id,
                'unit_id' => $unit->id,
                'cost_price' => 7.50,
                'landed_cost' => 8.20,
                'shipping_cost' => 0.40,
                'import_tax' => 0.20,
                'handling_cost' => 0.10,
                'selling_price' => 16.50,
                'wholesale_price' => 11.00,
                'vip_price' => 14.50,
                'member_price' => 15.00,
                'online_price' => 16.50,
                'tax_rate' => 0.1,
                'opening_stock' => 150,
                'min_stock' => 20,
                'max_stock' => 300,
                'safety_stock' => 15,
                'reorder_quantity' => 50,
                'description' => 'Heavyweight 100% combed ringspun cotton polo with ribbed collar and reinforced placket.',
                'short_description' => '100% Cotton Premium Embroidered Polo Shirt',
                'image_url' => 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
                'gallery_images' => [
                    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=500&auto=format&fit=crop&q=80',
                ],
                'tags' => ['Apparel', 'Polo', 'Cotton', 'Summer', 'Uniform'],
                'is_featured' => true,
                'is_new' => true,
                'visibility' => ['POS', 'WEBSITE', 'MOBILE_APP', 'WHOLESALE'],
                'rating_avg' => 4.85,
                'rating_count' => 24,
                'status_id' => 1,
            ]
        );

        // Variants for Polo Shirt
        $variantsData = [
            ['sku' => 'APP-POLO-BLK-S', 'name' => 'Polo Shirt - Black / S', 'attrs' => ['Color' => 'Black', 'Size' => 'S'], 'price' => 16.50, 'cost' => 7.50, 'stock' => 25],
            ['sku' => 'APP-POLO-BLK-M', 'name' => 'Polo Shirt - Black / M', 'attrs' => ['Color' => 'Black', 'Size' => 'M'], 'price' => 16.50, 'cost' => 7.50, 'stock' => 40],
            ['sku' => 'APP-POLO-BLK-L', 'name' => 'Polo Shirt - Black / L', 'attrs' => ['Color' => 'Black', 'Size' => 'L'], 'price' => 16.50, 'cost' => 7.50, 'stock' => 35],
            ['sku' => 'APP-POLO-WHT-M', 'name' => 'Polo Shirt - White / M', 'attrs' => ['Color' => 'White', 'Size' => 'M'], 'price' => 16.50, 'cost' => 7.50, 'stock' => 20],
            ['sku' => 'APP-POLO-WHT-L', 'name' => 'Polo Shirt - White / L', 'attrs' => ['Color' => 'White', 'Size' => 'L'], 'price' => 16.50, 'cost' => 7.50, 'stock' => 30],
        ];

        foreach ($variantsData as $v) {
            ProductVariant::firstOrCreate(
                ['sku' => $v['sku']],
                [
                    'product_id' => $polo->id,
                    'variant_name' => $v['name'],
                    'attribute_values' => $v['attrs'],
                    'cost_price' => $v['cost'],
                    'selling_price' => $v['price'],
                    'wholesale_price' => 11.00,
                    'stock_quantity' => $v['stock'],
                    'is_active' => true,
                ]
            );
        }

        // 4. Seed Bundle Product: SmartPOS Complete POS Hardware Bundle
        $touchTerminal = Product::first();
        $scanner = Product::skip(1)->first() ?: $touchTerminal;
        $printer = Product::skip(2)->first() ?: $touchTerminal;

        $bundleProduct = Product::firstOrCreate(
            ['sku' => 'BDL-POS-PRO'],
            [
                'name' => 'SmartPOS Enterprise Hardware Station (Complete Set)',
                'barcode' => '885991002233',
                'product_type' => 'BUNDLE',
                'product_code' => 'BDL-001',
                'category_id' => $cat?->id,
                'brand_id' => $brand?->id,
                'unit_id' => $unit->id,
                'cost_price' => 450.00,
                'landed_cost' => 475.00,
                'selling_price' => 699.00,
                'wholesale_price' => 580.00,
                'opening_stock' => 15,
                'min_stock' => 3,
                'description' => 'Complete point of sale terminal hardware bundle including touchscreen POS, thermal receipt printer, and 2D barcode scanner.',
                'image_url' => 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500&auto=format&fit=crop&q=80',
                'is_featured' => true,
                'status_id' => 1,
            ]
        );

        if ($touchTerminal && $scanner && $printer) {
            ProductBundle::firstOrCreate(
                ['bundle_product_id' => $bundleProduct->id, 'component_product_id' => $touchTerminal->id],
                ['quantity' => 1, 'unit_price_override' => 450.00]
            );
            ProductBundle::firstOrCreate(
                ['bundle_product_id' => $bundleProduct->id, 'component_product_id' => $scanner->id],
                ['quantity' => 1, 'unit_price_override' => 65.00]
            );
            ProductBundle::firstOrCreate(
                ['bundle_product_id' => $bundleProduct->id, 'component_product_id' => $printer->id],
                ['quantity' => 1, 'unit_price_override' => 120.00]
            );
        }

        // 5. Seed Manufacturing BOM: Artisan Signature Caramel Latte
        $rawCoffee = Product::firstOrCreate(
            ['sku' => 'RAW-COFFEE-BEANS'],
            [
                'name' => 'Single-Origin Espresso Roast Coffee Beans (1kg)',
                'product_type' => 'SIMPLE',
                'unit_id' => $unit->id,
                'cost_price' => 12.00,
                'selling_price' => 18.00,
                'opening_stock' => 50,
                'status_id' => 1,
            ]
        );

        $rawMilk = Product::firstOrCreate(
            ['sku' => 'RAW-FRESH-MILK'],
            [
                'name' => 'Farm Fresh Whole Barista Milk (1L)',
                'product_type' => 'SIMPLE',
                'unit_id' => $unit->id,
                'cost_price' => 1.80,
                'selling_price' => 2.50,
                'opening_stock' => 100,
                'status_id' => 1,
            ]
        );

        $latteProduct = Product::firstOrCreate(
            ['sku' => 'BEV-CARAMEL-LATTE'],
            [
                'name' => 'House Special Artisan Caramel Latte (16oz)',
                'product_type' => 'MANUFACTURED',
                'category_id' => $cat?->id,
                'unit_id' => $unit->id,
                'cost_price' => 0.85,
                'selling_price' => 3.75,
                'opening_stock' => 80,
                'description' => 'Freshly extracted double espresso infused with steamed whole milk and velvety French caramel.',
                'image_url' => 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=80',
                'is_featured' => true,
                'status_id' => 1,
            ]
        );

        ProductBom::firstOrCreate(
            ['parent_product_id' => $latteProduct->id, 'raw_material_product_id' => $rawCoffee->id],
            ['quantity_required' => 0.02, 'unit_cost' => 0.24, 'waste_percentage' => 2.0]
        );
        ProductBom::firstOrCreate(
            ['parent_product_id' => $latteProduct->id, 'raw_material_product_id' => $rawMilk->id],
            ['quantity_required' => 0.25, 'unit_cost' => 0.45, 'waste_percentage' => 3.0]
        );

        // 6. Seed Batches & Expiry Tiers
        ProductBatch::firstOrCreate(
            ['batch_number' => 'LOT-MILK-202609A'],
            [
                'product_id' => $rawMilk->id,
                'lot_number' => 'MILK-D22',
                'manufacturing_date' => Carbon::now()->subDays(5),
                'expiry_date' => Carbon::now()->addDays(12),
                'quantity' => 45,
                'supplier_id' => $supplier?->id,
                'warehouse_id' => $warehouse?->id,
                'unit_cost' => 1.80,
                'status' => 'EXPIRING_SOON',
            ]
        );

        ProductBatch::firstOrCreate(
            ['batch_number' => 'LOT-COFFEE-BRZ88'],
            [
                'product_id' => $rawCoffee->id,
                'lot_number' => 'BRZ-SUL-MINAS',
                'manufacturing_date' => Carbon::now()->subDays(15),
                'expiry_date' => Carbon::now()->addDays(240),
                'quantity' => 30,
                'supplier_id' => $supplier?->id,
                'warehouse_id' => $warehouse?->id,
                'unit_cost' => 12.00,
                'status' => 'FRESH',
            ]
        );

        ProductBatch::firstOrCreate(
            ['batch_number' => 'LOT-JUICE-EXP01'],
            [
                'product_id' => $rawMilk->id,
                'lot_number' => 'OLD-STOCK-09',
                'manufacturing_date' => Carbon::now()->subDays(45),
                'expiry_date' => Carbon::now()->subDays(4),
                'quantity' => 6,
                'supplier_id' => $supplier?->id,
                'warehouse_id' => $warehouse?->id,
                'unit_cost' => 1.80,
                'status' => 'EXPIRED',
            ]
        );

        // 7. Seed Serial Numbers & Warranties
        if ($touchTerminal) {
            ProductSerialNumber::firstOrCreate(
                ['serial_number' => 'SN-POS-2026-99014'],
                [
                    'product_id' => $touchTerminal->id,
                    'imei' => '864901239841029',
                    'status' => 'AVAILABLE',
                    'warranty_expiry_date' => Carbon::now()->addMonths(24),
                ]
            );

            ProductSerialNumber::firstOrCreate(
                ['serial_number' => 'SN-POS-2026-88021'],
                [
                    'product_id' => $touchTerminal->id,
                    'imei' => '864901239841030',
                    'status' => 'SOLD',
                    'warranty_expiry_date' => Carbon::now()->addMonths(24),
                ]
            );

            ProductWarranty::firstOrCreate(
                ['product_id' => $touchTerminal->id, 'serial_number' => 'SN-POS-2026-99014'],
                [
                    'warranty_period_months' => 24,
                    'start_date' => Carbon::now(),
                    'end_date' => Carbon::now()->addMonths(24),
                    'warranty_type' => 'MANUFACTURER',
                    'provider' => 'SmartPOS Hardware Corp.',
                    'terms' => 'Covers motherboard, capacitive touchscreen panel, and power board.',
                    'claim_status' => 'ACTIVE',
                ]
            );
        }

        // 8. Seed Warehouse Bin Locations
        if ($warehouse) {
            ProductWarehouseLocation::firstOrCreate(
                ['product_id' => $polo->id, 'warehouse_id' => $warehouse->id],
                ['zone' => 'Zone B', 'rack' => 'Rack 04', 'shelf' => 'Shelf 02', 'bin' => 'Bin 18', 'quantity' => 150]
            );

            if ($touchTerminal) {
                ProductWarehouseLocation::firstOrCreate(
                    ['product_id' => $touchTerminal->id, 'warehouse_id' => $warehouse->id],
                    ['zone' => 'Zone A (Electronics)', 'rack' => 'Rack 01', 'shelf' => 'Shelf 03', 'bin' => 'Bin 05', 'quantity' => 12]
                );
            }
        }

        // 9. Seed Multi-Tier Price Rules
        ProductPriceRule::firstOrCreate(
            ['name' => 'VIP Member Discount'],
            [
                'product_id' => $polo->id,
                'rule_type' => 'CUSTOMER_GROUP',
                'price_value' => 14.50,
                'is_active' => true,
            ]
        );

        ProductPriceRule::firstOrCreate(
            ['name' => 'Wholesale Tier (Buy 10+)'],
            [
                'product_id' => $polo->id,
                'rule_type' => 'QUANTITY_TIER',
                'price_value' => 11.00,
                'min_quantity' => 10,
                'is_active' => true,
            ]
        );

        // 10. Seed QC Inspections
        ProductQcInspection::firstOrCreate(
            ['product_id' => $polo->id, 'inspector_name' => 'Ratha Seng'],
            [
                'inspection_date' => Carbon::now()->subDays(2),
                'sample_size' => 50,
                'passed_quantity' => 49,
                'failed_quantity' => 1,
                'defect_type' => 'Minor stitching thread loose on sleeve',
                'status' => 'PASSED',
                'notes' => 'Batch meets Grade A retail export standards.',
            ]
        );

        // 11. Seed Customer Reviews
        ProductReview::firstOrCreate(
            ['product_id' => $polo->id, 'customer_name' => 'Sokha Mean'],
            [
                'rating' => 5,
                'review_title' => 'Top notch fabric quality and fit!',
                'review_text' => 'The embroidery is crisp and clean, washed three times and no shrinkage.',
                'status' => 'APPROVED',
            ]
        );

        ProductReview::firstOrCreate(
            ['product_id' => $polo->id, 'customer_name' => 'Bona Chan'],
            [
                'rating' => 5,
                'review_title' => 'Great uniforms for staff',
                'review_text' => 'Ordered 30 shirts for our cafe team. Super comfortable all day.',
                'status' => 'APPROVED',
            ]
        );

        // 12. Seed Product Templates
        ProductTemplate::firstOrCreate(
            ['name' => 'Retail Electronics Standard Template'],
            [
                'category_id' => $cat?->id,
                'brand_id' => $brand?->id,
                'product_type' => 'SIMPLE',
                'default_attributes' => ['Warranty' => '12 Months', 'Voltage' => '220V', 'Condition' => 'Brand New Sealed'],
                'default_pricing' => ['target_margin' => 30, 'tax_rate' => 0.1],
            ]
        );
    }
}