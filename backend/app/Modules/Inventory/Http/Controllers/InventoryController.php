<?php

namespace App\Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Persistence\Models\Stock;
use App\Modules\Inventory\Persistence\Models\StockMovement;
use App\Modules\Inventory\Application\Actions\AdjustStockAction;
use App\Modules\Inventory\Application\Actions\TransferStockAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function stocks(Request $request): JsonResponse
    {
        $query = Stock::with(['product.category', 'product.unit', 'warehouse']);

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->input('warehouse_id'));
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->input('product_id'));
        }

        $stocks = $query->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $stocks,
        ]);
    }

    public function movements(Request $request): JsonResponse
    {
        $query = StockMovement::with(['product', 'warehouse', 'creator'])->latest('created_at');

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->input('product_id'));
        }

        if ($request->filled('movement_type')) {
            $query->where('movement_type', $request->input('movement_type'));
        }

        $movements = $query->paginate($request->integer('per_page', 25));

        return response()->json([
            'success' => true,
            'data' => $movements,
        ]);
    }

    public function alerts(): JsonResponse
    {
        // Reorder level breached or available quantity <= 10
        $lowStocks = Stock::with(['product', 'warehouse'])
            ->where(function ($q) {
                $q->whereColumn('available_quantity', '<=', 'reorder_level')
                  ->orWhere('available_quantity', '<=', 10);
            })
            ->get();

        return response()->json([
            'success' => true,
            'data' => $lowStocks,
        ]);
    }

    public function adjust(Request $request, AdjustStockAction $action): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['required', 'numeric', 'min:0.0001'],
            'type' => ['required', 'string', 'in:INCREASE,DECREASE'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $adjustment = $action->execute(
            $validated['warehouse_id'],
            $validated['product_id'],
            (float) $validated['quantity'],
            $validated['type'],
            $validated['reason'],
            $request->user()?->id ?? 1
        );

        return response()->json([
            'success' => true,
            'message' => 'Stock adjusted successfully',
            'data' => $adjustment,
        ], 201);
    }

    public function transfer(Request $request, TransferStockAction $action): JsonResponse
    {
        $validated = $request->validate([
            'from_warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'to_warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['required', 'numeric', 'min:0.0001'],
            'notes' => ['nullable', 'string'],
        ]);

        $transfer = $action->execute(
            $validated['from_warehouse_id'],
            $validated['to_warehouse_id'],
            $validated['product_id'],
            (float) $validated['quantity'],
            $validated['notes'] ?? null,
            $request->user()?->id ?? 1
        );

        return response()->json([
            'success' => true,
            'message' => 'Stock transferred successfully',
            'data' => $transfer,
        ], 201);
    }
}
