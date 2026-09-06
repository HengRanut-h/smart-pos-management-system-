<?php

namespace App\Modules\Purchasing\Infrastructure\Repositories;

use App\Modules\Purchasing\Domain\Contracts\PurchaseRepositoryInterface;
use App\Modules\Purchasing\Persistence\Models\Purchase;
use App\Modules\Purchasing\Persistence\Models\PurchaseItem;
use App\Modules\Inventory\Persistence\Models\Stock;
use App\Modules\Inventory\Persistence\Models\StockMovement;
use App\Modules\Settings\Persistence\Models\SysStatus;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class EloquentPurchaseRepository implements PurchaseRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Purchase::with(['supplier', 'branch', 'warehouse', 'creator', 'status', 'items.product'])->latest()->paginate($perPage);
    }

    public function findById(int $id): ?Purchase
    {
        return Purchase::with(['items.product', 'supplier', 'branch', 'warehouse', 'creator', 'approver', 'status'])->find($id);
    }

    public function createWithItems(array $purchaseData, array $itemsData): Purchase
    {
        return DB::transaction(function () use ($purchaseData, $itemsData) {
            $purchase = Purchase::create($purchaseData);

            foreach ($itemsData as $item) {
                $item['purchase_id'] = $purchase->id;
                PurchaseItem::create($item);
            }

            return $purchase->load('items.product');
        });
    }

    public function approve(int $id, int $userId): Purchase
    {
        $purchase = Purchase::findOrFail($id);
        $statusApproved = SysStatus::where('domain', 'PURCHASE')->where('code', 'APPROVED')->value('id') ?? 1;

        $purchase->update([
            'status_id' => $statusApproved,
            'approved_by' => $userId,
            'approved_at' => now(),
        ]);

        return $purchase;
    }

    public function receiveGoods(int $id, array $receivedItems, int $userId): Purchase
    {
        return DB::transaction(function () use ($id, $receivedItems, $userId) {
            $purchase = Purchase::with('items')->findOrFail($id);

            $allFullyReceived = true;

            foreach ($receivedItems as $rec) {
                $item = $purchase->items->where('id', $rec['purchase_item_id'])->first();
                if (! $item) {
                    throw new InvalidArgumentException("Purchase item {$rec['purchase_item_id']} does not belong to PO {$purchase->id}");
                }

                $newReceived = (float) $item->received_quantity + (float) $rec['quantity'];
                if ($newReceived > (float) $item->quantity) {
                    throw new InvalidArgumentException("Received quantity ({$newReceived}) cannot exceed ordered quantity ({$item->quantity})");
                }

                $item->received_quantity = $newReceived;
                $item->save();

                if ($item->received_quantity < $item->quantity) {
                    $allFullyReceived = false;
                }

                // Inventory Increase
                $stock = Stock::firstOrCreate(
                    [
                        'warehouse_id' => $purchase->warehouse_id,
                        'product_id' => $item->product_id,
                    ],
                    [
                        'quantity' => 0,
                        'reserved_quantity' => 0,
                        'available_quantity' => 0,
                    ]
                );

                $before = (float) $stock->quantity;
                $stock->quantity += $rec['quantity'];
                $stock->available_quantity += $rec['quantity'];
                $stock->save();

                // Immutable Stock Movement Ledger
                StockMovement::create([
                    'product_id' => $item->product_id,
                    'warehouse_id' => $purchase->warehouse_id,
                    'movement_type' => 'PURCHASE_RECEIPT',
                    'quantity' => $rec['quantity'],
                    'before_quantity' => $before,
                    'after_quantity' => (float) $stock->quantity,
                    'reference_type' => Purchase::class,
                    'reference_id' => $purchase->id,
                    'unit_cost' => $item->unit_cost,
                    'created_by' => $userId,
                    'created_at' => now(),
                ]);
            }

            $statusCode = $allFullyReceived ? 'FULLY_RECEIVED' : 'PARTIALLY_RECEIVED';
            $statusId = SysStatus::where('domain', 'PURCHASE')->where('code', $statusCode)->value('id') ?? $purchase->status_id;

            $purchase->status_id = $statusId;
            $purchase->save();

            return $purchase->load('items.product');
        });
    }
}
