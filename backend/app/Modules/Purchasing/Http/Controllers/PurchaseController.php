<?php

namespace App\Modules\Purchasing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Purchasing\Domain\Contracts\PurchaseRepositoryInterface;
use App\Modules\Purchasing\Application\Actions\CreatePurchaseAction;
use App\Modules\Purchasing\Application\DTOs\CreatePurchaseDTO;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseController extends Controller
{
    public function __construct(
        private readonly PurchaseRepositoryInterface $repository
    ) {}

    public function index(Request $request): JsonResponse
    {
        $purchases = $this->repository->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $purchases,
        ]);
    }

    public function store(Request $request, CreatePurchaseAction $action): JsonResponse
    {
        $validated = $request->validate([
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.unit_id' => ['required', 'integer', 'exists:units,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.0001'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $purchase = $action->execute(new CreatePurchaseDTO(
            supplierId: $validated['supplier_id'],
            branchId: $validated['branch_id'],
            warehouseId: $validated['warehouse_id'],
            createdBy: $request->user()?->id ?? 1,
            items: $validated['items'],
            notes: $validated['notes'] ?? null
        ));

        return response()->json([
            'success' => true,
            'message' => 'Purchase order created successfully',
            'data' => $purchase,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $purchase = $this->repository->findById($id);
        if (! $purchase) {
            return response()->json(['success' => false, 'message' => 'Purchase not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $purchase]);
    }

    public function approve(int $id, Request $request): JsonResponse
    {
        $purchase = $this->repository->approve($id, $request->user()?->id ?? 1);

        return response()->json([
            'success' => true,
            'message' => 'Purchase order approved',
            'data' => $purchase,
        ]);
    }

    public function receive(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.purchase_item_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.0001'],
        ]);

        $purchase = $this->repository->receiveGoods($id, $validated['items'], $request->user()?->id ?? 1);

        return response()->json([
            'success' => true,
            'message' => 'Goods received and inventory updated',
            'data' => $purchase,
        ]);
    }
}
