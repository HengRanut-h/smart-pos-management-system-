<?php

use App\Modules\Category\Persistence\Models\Category;
use App\Modules\Unit\Persistence\Models\Unit;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\Inventory\Persistence\Models\Stock;
use App\Modules\Settings\Persistence\Models\SysStatus;
use App\Modules\Warehouse\Persistence\Models\Warehouse;

$activeStatusId = SysStatus::where('domain', 'SYSTEM')->where('code', 'ACTIVE')->value('id') ?? 1;
$warehouse = Warehouse::first();

$beverages = Category::firstOrCreate(['code' => 'BEV'], ['name' => 'Beverages & Drinks', 'status_id' => $activeStatusId]);
$snacks = Category::firstOrCreate(['code' => 'SNK'], ['name' => 'Snacks & Bakery', 'status_id' => $activeStatusId]);
$tech = Category::firstOrCreate(['code' => 'TEC'], ['name' => 'Electronics & Accessories', 'status_id' => $activeStatusId]);

$can = Unit::firstOrCreate(['code' => 'CAN'], ['name' => 'Can', 'status_id' => $activeStatusId]);
$pack = Unit::firstOrCreate(['code' => 'PCK'], ['name' => 'Pack', 'status_id' => $activeStatusId]);
$piece = Unit::firstOrCreate(['code' => 'PCS'], ['name' => 'Piece', 'status_id' => $activeStatusId]);

$items = [
    [
        'sku' => 'BEV-001',
        'barcode' => '8850123456781',
        'name' => 'Coca Cola Can 330ml',
        'category_id' => $beverages->id,
        'unit_id' => $can->id,
        'cost_price' => 0.40,
        'selling_price' => 0.75,
        'tax_rate' => 0.10,
        'status_id' => $activeStatusId,
        'initial_stock' => 120,
    ],
    [
        'sku' => 'BEV-002',
        'barcode' => '8850123456782',
        'name' => 'Angkor Beer Premium Can 330ml',
        'category_id' => $beverages->id,
        'unit_id' => $can->id,
        'cost_price' => 0.65,
        'selling_price' => 1.25,
        'tax_rate' => 0.10,
        'status_id' => $activeStatusId,
        'initial_stock' => 80,
    ],
    [
        'sku' => 'SNK-001',
        'barcode' => '8850123456783',
        'name' => 'Lays Classic Potato Chips 50g',
        'category_id' => $snacks->id,
        'unit_id' => $pack->id,
        'cost_price' => 0.80,
        'selling_price' => 1.50,
        'tax_rate' => 0.10,
        'status_id' => $activeStatusId,
        'initial_stock' => 50,
    ],
    [
        'sku' => 'TEC-001',
        'barcode' => '8850123456784',
        'name' => 'USB-C Fast Charging Cable 1m',
        'category_id' => $tech->id,
        'unit_id' => $piece->id,
        'cost_price' => 2.50,
        'selling_price' => 5.99,
        'tax_rate' => 0.10,
        'status_id' => $activeStatusId,
        'initial_stock' => 30,
    ],
    [
        'sku' => 'TEC-002',
        'barcode' => '8850123456785',
        'name' => 'Wireless Bluetooth Mouse',
        'category_id' => $tech->id,
        'unit_id' => $piece->id,
        'cost_price' => 7.00,
        'selling_price' => 14.50,
        'tax_rate' => 0.10,
        'status_id' => $activeStatusId,
        'initial_stock' => 25,
    ],
];

foreach ($items as $item) {
    $stockQty = $item['initial_stock'];
    unset($item['initial_stock']);

    $p = Product::firstOrCreate(['sku' => $item['sku']], $item);

    if ($warehouse) {
        Stock::firstOrCreate(
            ['warehouse_id' => $warehouse->id, 'product_id' => $p->id],
            [
                'quantity' => $stockQty,
                'reserved_quantity' => 0,
                'available_quantity' => $stockQty,
                'reorder_level' => 10,
            ]
        );
    }
}

echo "Successfully seeded sample products and stock!\n";
