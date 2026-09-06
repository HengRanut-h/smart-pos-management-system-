<?php

namespace App\Modules\Return\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Return\Domain\Contracts\ReturnRepositoryInterface;
use App\Modules\Settings\Persistence\Models\SysStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReturnController extends Controller
{
    public function __construct(
        private readonly ReturnRepositoryInterface $repository
    ) {}

    public function index(Request $request): JsonResponse
    {
        $returns = $this->repository->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $returns,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sale_id' => ['required', 'integer', 'exists:sales,id'],
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'reason_id' => ['nullable', 'integer'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.sale_item_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.0001'],
            'items.*.restockable' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $statusCompleted = SysStatus::where('domain', 'RETURN')->where('code', 'COMPLETED')->value('id') ?? 1;
        $validated['status_id'] = $statusCompleted;

        $returnRecord = $this->repository->processReturn(
            $validated,
            $validated['items'],
            $request->user()?->id ?? 1
        );

        return response()->json([
            'success' => true,
            'message' => 'Sale return processed successfully',
            'data' => $returnRecord,
        ], 201);
    }

    public function voidSale(int $saleId, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:255'],
        ]);

        $voidedSale = $this->repository->voidSale($saleId, $validated['reason'], $request->user()?->id ?? 1);

        return response()->json([
            'success' => true,
            'message' => 'Sale voided and inventory restored successfully',
            'data' => $voidedSale,
        ]);
    }
}
