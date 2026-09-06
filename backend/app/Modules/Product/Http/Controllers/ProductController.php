<?php

namespace App\Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Product\Domain\Contracts\ProductRepositoryInterface;
use App\Modules\Product\Http\Requests\CreateProductRequest;
use App\Modules\Product\Application\Actions\CreateProductAction;
use App\Modules\Product\Http\Resources\ProductResource;
use App\Modules\Inventory\Persistence\Models\Stock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductRepositoryInterface $repository
    ) {}

    public function index(Request $request): JsonResponse
    {
        $products = $this->repository->paginate($request->integer('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => ProductResource::collection($products)->response()->getData(true),
        ]);
    }

    public function store(CreateProductRequest $request, CreateProductAction $action): JsonResponse
    {
        $product = $action->execute($request->toDTO());

        if ($request->filled('initial_stock') && (float) $request->input('initial_stock') > 0) {
            Stock::updateOrCreate(
                ['warehouse_id' => 1, 'product_id' => $product->id],
                [
                    'quantity' => (float) $request->input('initial_stock'),
                    'available_quantity' => (float) $request->input('initial_stock'),
                    'reorder_level' => $product->reorder_level ?? 10,
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => new ProductResource($product->load(['category', 'brand', 'unit', 'stocks'])),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $product = $this->repository->findById($id);
        if (! $product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new ProductResource($product),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'sku' => 'sometimes|string|max:100|unique:products,sku,' . $id,
            'barcode' => 'sometimes|nullable|string|max:100|unique:products,barcode,' . $id,
            'category_id' => 'sometimes|nullable|integer|exists:categories,id',
            'brand_id' => 'sometimes|nullable|integer|exists:brands,id',
            'unit_id' => 'sometimes|integer|exists:units,id',
            'cost_price' => 'sometimes|numeric|min:0',
            'selling_price' => 'sometimes|numeric|min:0',
            'image_url' => 'sometimes|nullable|string',
            'description' => 'sometimes|nullable|string',
            'tax_rate' => 'sometimes|nullable|numeric|min:0',
            'reorder_level' => 'sometimes|nullable|numeric|min:0',
        ]);

        $product = $this->repository->update($id, $validated);

        if ($request->filled('available_quantity')) {
            $qty = (float) $request->input('available_quantity');
            Stock::updateOrCreate(
                ['warehouse_id' => 1, 'product_id' => $product->id],
                [
                    'quantity' => $qty,
                    'available_quantity' => $qty,
                    'reorder_level' => $product->reorder_level ?? 10,
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => new ProductResource($product->load(['category', 'brand', 'unit', 'stocks'])),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->repository->delete($id);

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully',
        ]);
    }
}
