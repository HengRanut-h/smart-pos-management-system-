<?php

namespace App\Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\Product\Persistence\Models\ProductBundle;
use App\Modules\Product\Persistence\Models\ProductBom;

class ProductManufacturingController extends Controller
{
    public function getBundles($productId): JsonResponse
    {
        $bundles = ProductBundle::with('componentProduct')
            ->where('bundle_product_id', $productId)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $bundles,
        ]);
    }

    public function saveBundle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bundle_product_id' => 'required|exists:products,id',
            'components' => 'required|array|min:1',
            'components.*.component_product_id' => 'required|exists:products,id',
            'components.*.quantity' => 'required|numeric|min:1',
            'components.*.unit_price_override' => 'nullable|numeric|min:0',
        ]);

        ProductBundle::where('bundle_product_id', $validated['bundle_product_id'])->delete();

        $saved = [];
        foreach ($validated['components'] as $comp) {
            $saved[] = ProductBundle::create([
                'bundle_product_id' => $validated['bundle_product_id'],
                'component_product_id' => $comp['component_product_id'],
                'quantity' => $comp['quantity'],
                'unit_price_override' => $comp['unit_price_override'] ?? null,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Bundle / Kit components updated',
            'data' => $saved,
        ]);
    }

    public function getBoms($productId): JsonResponse
    {
        $boms = ProductBom::with('rawMaterial')
            ->where('parent_product_id', $productId)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $boms,
        ]);
    }

    public function saveBom(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'parent_product_id' => 'required|exists:products,id',
            'materials' => 'required|array|min:1',
            'materials.*.raw_material_product_id' => 'required|exists:products,id',
            'materials.*.quantity_required' => 'required|numeric|min:0.001',
            'materials.*.unit_cost' => 'nullable|numeric|min:0',
            'materials.*.waste_percentage' => 'nullable|numeric|min:0',
        ]);

        ProductBom::where('parent_product_id', $validated['parent_product_id'])->delete();

        $saved = [];
        foreach ($validated['materials'] as $mat) {
            $saved[] = ProductBom::create([
                'parent_product_id' => $validated['parent_product_id'],
                'raw_material_product_id' => $mat['raw_material_product_id'],
                'quantity_required' => $mat['quantity_required'],
                'unit_cost' => $mat['unit_cost'] ?? 0,
                'waste_percentage' => $mat['waste_percentage'] ?? 0,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Bill of Materials recipe updated',
            'data' => $saved,
        ]);
    }
}