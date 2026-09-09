<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\Product\Persistence\Models\ProductBarcode;

class ProductBarcodeSeeder extends Seeder
{
    public function run(): void
    {
        $coke = Product::where('sku', 'BEV-001')->orWhere('id', 1)->first();
        if ($coke) {
            ProductBarcode::firstOrCreate(
                ['barcode' => '8850123456789'],
                [
                    'product_id' => $coke->id,
                    'barcode_type' => 'EAN_13',
                    'package_type' => 'PACK',
                    'multiplier' => 6,
                    'custom_price' => 4.20,
                    'is_primary' => false,
                    'notes' => '6-Pack Shrink Wrapped Cans',
                ]
            );

            ProductBarcode::firstOrCreate(
                ['barcode' => '8850123456790'],
                [
                    'product_id' => $coke->id,
                    'barcode_type' => 'CODE_128',
                    'package_type' => 'CARTON',
                    'multiplier' => 24,
                    'custom_price' => 15.50,
                    'is_primary' => false,
                    'notes' => 'Wholesale Master 24-Can Carton',
                ]
            );
        }

        $lays = Product::where('sku', 'SNK-001')->orWhere('id', 3)->first();
        if ($lays) {
            ProductBarcode::firstOrCreate(
                ['barcode' => '8850123456800'],
                [
                    'product_id' => $lays->id,
                    'barcode_type' => 'EAN_13',
                    'package_type' => 'BOX',
                    'multiplier' => 12,
                    'custom_price' => 16.00,
                    'is_primary' => false,
                    'notes' => 'Display Box 12 Bags',
                ]
            );
        }
    }
}
