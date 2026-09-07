<?php

namespace App\Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\Product\Persistence\Models\ProductVariant;

class ProductVariantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ProductVariant::with('product');

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'sku' => 'required|string|unique:product_variants,sku',
            'barcode' => 'nullable|string',
            'variant_name' => 'required|string',
            'attribute_values' => 'nullable|array',
            'cost_price' => 'nullable|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'weight' => 'nullable|numeric',
            'stock_quantity' => 'nullable|numeric|min:0',
            'image_url' => 'nullable|string',
        ]);

        $variant = ProductVariant::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product variant created',
            'data' => $variant,
        ], 201);
    }

    public function generateMatrix(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'attributes' => 'required|array',
            'base_price' => 'nullable|numeric',
            'base_cost' => 'nullable|numeric',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $attrs = $validated['attributes'];
        $basePrice = $validated['base_price'] ?? $product->selling_price;
        $baseCost = $validated['base_cost'] ?? $product->cost_price;

        $combinations = [[]];
        foreach ($attrs as $attr) {
            $name = $attr['name'];
            $values = $attr['values'] ?? [];
            $tmp = [];
            foreach ($combinations as $comb) {
                foreach ($values as $v) {
                    $tmp[] = array_merge($comb, [$name => $v]);
                }
            }
            $combinations = $tmp;
        }

        $created = [];
        foreach ($combinations as $idx => $comb) {
            $nameParts = array_values($comb);
            $variantName = $product->name . ' - ' . implode(' / ', $nameParts);
            $skuSuffix = strtoupper(implode('-', array_map(fn($val) => substr($val, 0, 3), $nameParts)));
            $sku = $product->sku . '-' . $skuSuffix;

            if (ProductVariant::where('sku', $sku)->exists()) {
                $sku .= '-' . ($idx + 1);
            }

            $variant = ProductVariant::create([
                'product_id' => $product->id,
                'sku' => $sku,
                'variant_name' => $variantName,
                'attribute_values' => $comb,
                'cost_price' => $baseCost,
                'selling_price' => $basePrice,
                'stock_quantity' => 10,
                'is_active' => true,
            ]);
            $created[] = $variant;
        }

        return response()->json([
            'success' => true,
            'message' => count($created) . ' variants generated successfully',
            'data' => $created,
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $variant = ProductVariant::findOrFail($id);
        $variant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Variant deleted',
        ]);
    }
}