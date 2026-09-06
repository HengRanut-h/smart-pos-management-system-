<?php

namespace App\Modules\Sales\Infrastructure\Repositories;

use App\Modules\Sales\Domain\Contracts\SaleRepositoryInterface;
use App\Modules\Sales\Persistence\Models\Sale;
use App\Modules\Sales\Persistence\Models\SaleItem;
use App\Modules\Payment\Persistence\Models\Payment;
use App\Modules\Inventory\Persistence\Models\Stock;
use App\Modules\Inventory\Persistence\Models\StockMovement;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class EloquentSaleRepository implements SaleRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Sale::with(['items.product', 'branch', 'customer', 'cashier'])->latest()->paginate($perPage);
    }

    public function findById(int $id): ?Sale
    {
        return Sale::with(['items.product', 'payments', 'branch', 'customer', 'cashier'])->find($id);
    }

    public function createWithItems(array $saleData, array $itemsData, array $paymentData): Sale
    {
        return DB::transaction(function () use ($saleData, $itemsData, $paymentData) {
            // 1. Create Sale
            $sale = Sale::create($saleData);

            // 2. Create Items & Deduct Inventory
            foreach ($itemsData as $item) {
                $item['sale_id'] = $sale->id;
                SaleItem::create($item);

                // Stock deduction (Atomic row lock & decrement)
                $stock = Stock::where('warehouse_id', $sale->warehouse_id)
                              ->where('product_id', $item['product_id'])
                              ->lockForUpdate()
                              ->first();

                if ($stock) {
                    $before = (float) $stock->quantity;
                    $stock->quantity -= $item['quantity'];
                    $stock->available_quantity -= $item['quantity'];
                    $stock->save();

                    StockMovement::create([
                        'product_id' => $item['product_id'],
                        'warehouse_id' => $sale->warehouse_id,
                        'movement_type' => 'SALE',
                        'quantity' => -$item['quantity'],
                        'before_quantity' => $before,
                        'after_quantity' => (float) $stock->quantity,
                        'reference_type' => Sale::class,
                        'reference_id' => $sale->id,
                        'created_by' => $sale->cashier_id,
                        'created_at' => now(),
                    ]);
                }
            }

            // 3. Record Payment
            if (!empty($paymentData)) {
                $paymentData['sale_id'] = $sale->id;
                $paymentData['created_by'] = $sale->cashier_id;
                $paymentData['paid_at'] = now();
                Payment::create($paymentData);
            }

            return $sale->load(['items.product', 'payments']);
        });
    }
}
