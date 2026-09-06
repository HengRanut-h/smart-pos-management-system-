<?php

namespace App\Modules\Sales\Domain\Rules;

use App\Modules\Inventory\Persistence\Models\Stock;
use App\Modules\Sales\Domain\Exceptions\InsufficientStockException;

class CheckSufficientStockRule
{
    public static function check(int $warehouseId, int $productId, float $quantity): void
    {
        $stock = Stock::where('warehouse_id', $warehouseId)
                      ->where('product_id', $productId)
                      ->first();

        $available = $stock ? (float) $stock->available_quantity : 0.0;

        if ($available < $quantity) {
            throw new InsufficientStockException($productId, $available, $quantity);
        }
    }
}
