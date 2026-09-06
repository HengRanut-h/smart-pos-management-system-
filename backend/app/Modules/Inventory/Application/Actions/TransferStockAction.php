<?php

namespace App\Modules\Inventory\Application\Actions;

use App\Modules\Inventory\Persistence\Models\Stock;
use App\Modules\Inventory\Persistence\Models\StockTransfer;
use App\Modules\Inventory\Persistence\Models\StockMovement;
use App\Modules\Settings\Persistence\Models\SysStatus;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class TransferStockAction
{
    public function execute(int $fromWarehouseId, int $toWarehouseId, int $productId, float $quantity, ?string $notes, int $userId): StockTransfer
    {
        if ($fromWarehouseId === $toWarehouseId) {
            throw new InvalidArgumentException("Source and destination warehouses cannot be the same.");
        }

        return DB::transaction(function () use ($fromWarehouseId, $toWarehouseId, $productId, $quantity, $notes, $userId) {
            $sourceStock = Stock::where('warehouse_id', $fromWarehouseId)
                                ->where('product_id', $productId)
                                ->lockForUpdate()
                                ->first();

            $sourceAvailable = $sourceStock ? (float) $sourceStock->available_quantity : 0.0;
            if ($sourceAvailable < $quantity) {
                throw new InvalidArgumentException("Insufficient source stock. Available: {$sourceAvailable}, Requested: {$quantity}");
            }

            // 1. Deduct from Source
            $sourceBefore = (float) $sourceStock->quantity;
            $sourceStock->quantity -= $quantity;
            $sourceStock->available_quantity -= $quantity;
            $sourceStock->save();

            // 2. Add to Destination
            $destStock = Stock::firstOrCreate(
                ['warehouse_id' => $toWarehouseId, 'product_id' => $productId],
                ['quantity' => 0, 'reserved_quantity' => 0, 'available_quantity' => 0]
            );
            $destBefore = (float) $destStock->quantity;
            $destStock->quantity += $quantity;
            $destStock->available_quantity += $quantity;
            $destStock->save();

            $statusCompleted = SysStatus::where('domain', 'SYSTEM')->where('code', 'ACTIVE')->value('id') ?? 1;

            $transfer = StockTransfer::create([
                'transfer_number' => 'TRF-' . strtoupper(uniqid()),
                'from_warehouse_id' => $fromWarehouseId,
                'to_warehouse_id' => $toWarehouseId,
                'product_id' => $productId,
                'quantity' => $quantity,
                'status_id' => $statusCompleted,
                'notes' => $notes,
                'created_by' => $userId,
            ]);

            // 3. Movement ledger entries
            StockMovement::create([
                'product_id' => $productId,
                'warehouse_id' => $fromWarehouseId,
                'movement_type' => 'TRANSFER_OUT',
                'quantity' => -$quantity,
                'before_quantity' => $sourceBefore,
                'after_quantity' => (float) $sourceStock->quantity,
                'reference_type' => StockTransfer::class,
                'reference_id' => $transfer->id,
                'created_by' => $userId,
                'created_at' => now(),
            ]);

            StockMovement::create([
                'product_id' => $productId,
                'warehouse_id' => $toWarehouseId,
                'movement_type' => 'TRANSFER_IN',
                'quantity' => $quantity,
                'before_quantity' => $destBefore,
                'after_quantity' => (float) $destStock->quantity,
                'reference_type' => StockTransfer::class,
                'reference_id' => $transfer->id,
                'created_by' => $userId,
                'created_at' => now(),
            ]);

            return $transfer->load(['fromWarehouse', 'toWarehouse', 'product']);
        });
    }
}
