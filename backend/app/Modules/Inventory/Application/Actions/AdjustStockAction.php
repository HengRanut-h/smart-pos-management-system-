<?php

namespace App\Modules\Inventory\Application\Actions;

use App\Modules\Inventory\Persistence\Models\Stock;
use App\Modules\Inventory\Persistence\Models\StockAdjustment;
use App\Modules\Inventory\Persistence\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class AdjustStockAction
{
    public function execute(int $warehouseId, int $productId, float $adjustedQuantity, string $type, string $reason, int $userId): StockAdjustment
    {
        return DB::transaction(function () use ($warehouseId, $productId, $adjustedQuantity, $type, $reason, $userId) {
            $stock = Stock::firstOrCreate(
                ['warehouse_id' => $warehouseId, 'product_id' => $productId],
                ['quantity' => 0, 'reserved_quantity' => 0, 'available_quantity' => 0]
            );

            $before = (float) $stock->quantity;
            $movementType = strtoupper($type); // INCREASE or DECREASE

            if ($movementType === 'DECREASE') {
                if ($before < $adjustedQuantity) {
                    throw new InvalidArgumentException("Cannot decrease stock by {$adjustedQuantity} units. Only {$before} available.");
                }
                $after = $before - $adjustedQuantity;
                $movementSign = -$adjustedQuantity;
                $movementLabel = 'ADJUSTMENT_DECREASE';
            } else {
                $after = $before + $adjustedQuantity;
                $movementSign = $adjustedQuantity;
                $movementLabel = 'ADJUSTMENT_INCREASE';
            }

            $stock->quantity = $after;
            $stock->available_quantity = max(0.0, $after - (float) $stock->reserved_quantity);
            $stock->last_counted_at = now();
            $stock->save();

            $adjustment = StockAdjustment::create([
                'adjustment_number' => 'ADJ-' . strtoupper(uniqid()),
                'warehouse_id' => $warehouseId,
                'product_id' => $productId,
                'type' => $movementType,
                'quantity' => $adjustedQuantity,
                'before_quantity' => $before,
                'after_quantity' => $after,
                'reason' => $reason,
                'created_by' => $userId,
            ]);

            StockMovement::create([
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'movement_type' => $movementLabel,
                'quantity' => $movementSign,
                'before_quantity' => $before,
                'after_quantity' => $after,
                'reference_type' => StockAdjustment::class,
                'reference_id' => $adjustment->id,
                'unit_cost' => null,
                'created_by' => $userId,
                'created_at' => now(),
            ]);

            return $adjustment->load(['warehouse', 'product']);
        });
    }
}
