<?php

namespace App\Modules\Sales\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Sales\Domain\Contracts\SaleRepositoryInterface;
use App\Modules\Sales\Http\Requests\CompleteSaleRequest;
use App\Modules\Sales\Application\Actions\CompleteSaleAction;
use App\Modules\Sales\Http\Resources\SaleResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaleController extends Controller
{
    public function __construct(
        private readonly SaleRepositoryInterface $repository
    ) {}

    public function index(Request $request): JsonResponse
    {
        $sales = $this->repository->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => SaleResource::collection($sales)->response()->getData(true),
        ]);
    }

    public function store(CompleteSaleRequest $request, CompleteSaleAction $action): JsonResponse
    {
        $sale = $action->execute($request->toDTO());

        return response()->json([
            'success' => true,
            'message' => 'Sale completed successfully',
            'data' => new SaleResource($sale),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $sale = $this->repository->findById($id);
        if (! $sale) {
            return response()->json([
                'success' => false,
                'message' => 'Sale not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new SaleResource($sale),
        ]);
    }
}
