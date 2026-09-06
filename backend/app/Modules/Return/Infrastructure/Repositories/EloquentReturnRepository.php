<?php

namespace App\Modules\Return\Infrastructure\Repositories;

use App\Modules\Return\Domain\Contracts\ReturnRepositoryInterface;
use App\Modules\Return\Persistence\Models\ReturnModel;
use App\Modules\Return\Persistence\Models\ReturnItem;
use App\Modules\Sales\Persistence\Models\Sale;
use App\Modules\Sales\Persistence\Models\SaleItem;
use App\Modules\Inventory\Persistence\Models\Stock;
use App\Modules\Inventory\Persistence\Models\StockMovement;
use App\Modules\Settings\Persistence\Models\SysStatus;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class EloquentReturnRepository implements ReturnRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return ReturnModel::with(['sale', 'customer', 'branch', 'warehouse', 'creator', 'items.product'])->latest()->paginate($perPage);
    }

    public function processReturn(array $returnData, array $itemsData, int $userId): ReturnModel
    {
        return DB::transaction(function () use ($returnData, $itemsData, $userId) {
            $sale = Sale::with('items')->findOrFail($returnData['sale_id']);

            $totalRefund = 0.0;
            $processedItems = [];

            foreach ($itemsData as $item) {
                $saleItem = $sale->items->where('id', $item['sale_item_id'])->first();
                if (! $saleItem) {
                    throw new InvalidArgumentException("Item {$item['sale_item_id']} does not belong to Sale {$sale->id}");
                }

                $eligible = (float) $saleItem->quantity - (float) $saleItem->returned_quantity;
                if ((float) $item['quantity'] > $eligible) {
                    throw new InvalidArgumentException("Returned quantity ({$item['quantity']}) exceeds eligible quantity ({$eligible})");
                }

                $lineRefund = (float) $item['quantity'] * (float) $saleItem->unit_price;
                $totalRefund += $lineRefund;

                // Update sale item returned quantity
                $saleItem->returned_quantity += $item['quantity'];
                $saleItem->save();

                // Compensating Inventory restoration if restockable
                if ($item['restockable'] ?? true) {
                    $stock = Stock::where('warehouse_id', $returnData['warehouse_id'])
                                  ->where('product_id', $saleItem->product_id)
                                  ->first();

                    if ($stock) {
                        $before = (float) $stock->quantity;
                        $stock->quantity += $item['quantity'];
                        $stock->available_quantity += $item['quantity'];
                        $stock->save();

                        StockMovement::create([
                            'product_id' => $saleItem->product_id,
                            'warehouse_id' => $returnData['warehouse_id'],
                            'movement_type' => 'RETURN',
                            'quantity' => $item['quantity'],
                            'before_quantity' => $before,
                            'after_quantity' => (float) $stock->quantity,
                            'reference_type' => ReturnModel::class,
                            'reference_id' => 0, // Assigned after creation
                            'unit_cost' => $saleItem->unit_price,
                            'created_by' => $userId,
                            'created_at' => now(),
                        ]);
                    }
                }

                $processedItems[] = [
                    'sale_item_id' => $saleItem->id,
                    'product_id' => $saleItem->product_id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $saleItem->unit_price,
                    'refund_amount' => $lineRefund,
                    'condition_id' => $item['condition_id'] ?? null,
                    'restockable' => $item['restockable'] ?? true,
                    'notes' => $item['notes'] ?? null,
                ];
            }

            $returnData['return_number'] = 'RET-' . strtoupper(uniqid());
            $returnData['subtotal'] = $totalRefund;
            $returnData['refund_amount'] = $totalRefund;
            $returnData['created_by'] = $userId;
            $returnData['return_date'] = now();

            $returnRecord = ReturnModel::create($returnData);

            foreach ($processedItems as $pItem) {
                $pItem['return_id'] = $returnRecord->id;
                ReturnItem::create($pItem);
            }

            // Update Sale status to PARTIALLY_RETURNED or FULLY_RETURNED
            $allReturned = $sale->items()->sum('returned_quantity') >= $sale->items()->sum('quantity');
            $statusReturnCode = $allReturned ? 'FULLY_RETURNED' : 'PARTIALLY_RETURNED';
            $statusReturnId = SysStatus::where('domain', 'SALE')->where('code', $statusReturnCode)->value('id') ?? $sale->status_id;

            $sale->status_id = $statusReturnId;
            $sale->save();

            return $returnRecord->load('items.product');
        });
    }

    public function voidSale(int $saleId, string $reason, int $userId): Sale
    {
        return DB::transaction(function () use ($saleId, $reason, $userId) {
            $sale = Sale::with(['items', 'payments'])->findOrFail($saleId);

            $statusVoided = SysStatus::where('domain', 'SALE')->where('code', 'VOIDED')->value('id') ?? 1;
            $statusRefunded = SysStatus::where('domain', 'PAYMENT')->where('code', 'REFUNDED')->value('id') ?? 1;

            // 1. Compensating Inventory Restorations for all items
            foreach ($sale->items as $item) {
                $restorable = (float) $item->quantity - (float) $item->returned_quantity;
                if ($restorable > 0) {
                    $stock = Stock::where('warehouse_id', $sale->warehouse_id)
                                  ->where('product_id', $item->product_id)
                                  ->first();

                    if ($stock) {
                        $before = (float) $stock->quantity;
                        $stock->quantity += $restorable;
                        $stock->available_quantity += $restorable;
                        $stock->save();

                        StockMovement::create([
                            'product_id' => $item->product_id,
                            'warehouse_id' => $sale->warehouse_id,
                            'movement_type' => 'VOID',
                            'quantity' => $restorable,
                            'before_quantity' => $before,
                            'after_quantity' => (float) $stock->quantity,
                            'reference_type' => Sale::class,
                            'reference_id' => $sale->id,
                            'unit_cost' => $item->unit_price,
                            'created_by' => $userId,
                            'created_at' => now(),
                        ]);
                    }
                    $item->returned_quantity = $item->quantity;
                    $item->save();
                }
            }

            // 2. Mark payments as refunded/reversed
            foreach ($sale->payments as $payment) {
                $payment->status_id = $statusRefunded;
                $payment->save();
            }

            // 3. Mark Sale as VOIDED with audit note
            $sale->status_id = $statusVoided;
            $sale->payment_status_id = $statusRefunded;
            $sale->notes = ($sale->notes ? $sale->notes . ' | ' : '') . "VOIDED: {$reason} by User #{$userId}";
            $sale->save();

            return $sale->load(['items', 'payments']);
        });
    }
}
