<?php

namespace App\Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\Product\Persistence\Models\ProductAuditLog;
use App\Modules\Product\Persistence\Models\ProductPriceHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ProductCatalogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'brand', 'unit', 'status', 'variants']);

        if ($request->filled('search')) {
            $s = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', $s)
                  ->orWhere('sku', 'like', $s)
                  ->orWhere('barcode', 'like', $s)
                  ->orWhere('product_code', 'like', $s);
            });
        }

        if ($request->filled('category_id') && $request->category_id !== 'ALL') {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('brand_id') && $request->brand_id !== 'ALL') {
            $query->where('brand_id', $request->brand_id);
        }

        if ($request->filled('product_type') && $request->product_type !== 'ALL') {
            $query->where('product_type', $request->product_type);
        }

        if ($request->filled('status_id') && $request->status_id !== 'ALL') {
            $query->where('status_id', $request->status_id);
        }

        if ($request->filled('is_featured')) {
            $query->where('is_featured', filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('is_new')) {
            $query->where('is_new', filter_var($request->is_new, FILTER_VALIDATE_BOOLEAN));
        }

        // Sorting
        $sort = $request->get('sort_by', 'id_desc');
        switch ($sort) {
            case 'name_asc':
                $query->orderBy('name', 'asc');
                break;
            case 'name_desc':
                $query->orderBy('name', 'desc');
                break;
            case 'price_asc':
                $query->orderBy('selling_price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('selling_price', 'desc');
                break;
            case 'stock_asc':
                $query->orderBy('opening_stock', 'asc');
                break;
            case 'stock_desc':
                $query->orderBy('opening_stock', 'desc');
                break;
            default:
                $query->orderBy('id', 'desc');
                break;
        }

        $perPage = (int) $request->get('per_page', 25);
        $products = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    public function show($id): JsonResponse
    {
        $product = Product::with([
            'category',
            'brand',
            'unit',
            'status',
            'variants',
            'attributeValues.attribute',
            'warehouseLocations.warehouse',
            'suppliers.supplier',
            'bundleComponents.componentProduct',
            'bomItems.rawMaterial',
            'batches.supplier',
            'serialNumbers',
            'warranties',
            'qcInspections',
            'reviews',
            'priceRules',
            'priceHistory',
            'auditLogs',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:products,sku',
            'barcode' => 'nullable|string|max:100|unique:products,barcode',
            'product_type' => 'nullable|string|max:50',
            'product_code' => 'nullable|string|max:100',
            'category_id' => 'nullable|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'unit_id' => 'required|exists:units,id',
            'cost_price' => 'nullable|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'vip_price' => 'nullable|numeric|min:0',
            'member_price' => 'nullable|numeric|min:0',
            'online_price' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0',
            'min_stock' => 'nullable|numeric|min:0',
            'max_stock' => 'nullable|numeric|min:0',
            'safety_stock' => 'nullable|numeric|min:0',
            'opening_stock' => 'nullable|numeric|min:0',
            'reorder_level' => 'nullable|numeric|min:0',
            'reorder_quantity' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'gallery_images' => 'nullable|array',
            'tags' => 'nullable|array',
            'weight' => 'nullable|numeric',
            'dimensions' => 'nullable|string',
            'seo_slug' => 'nullable|string',
            'seo_title' => 'nullable|string',
            'seo_description' => 'nullable|string',
            'is_featured' => 'nullable|boolean',
            'is_new' => 'nullable|boolean',
            'visibility' => 'nullable|array',
            'status_id' => 'nullable|exists:sys_statuses,id',
        ]);

        if (empty($validated['status_id'])) {
            $validated['status_id'] = 1;
        }

        if (empty($validated['seo_slug'])) {
            $validated['seo_slug'] = Str::slug($validated['name']) . '-' . strtolower(Str::random(4));
        }

        $product = Product::create($validated);

        // Audit Log
        ProductAuditLog::create([
            'product_id' => $product->id,
            'user_id' => auth()->id() ?? 1,
            'action' => 'PRODUCT_CREATED',
            'field_name' => 'all',
            'old_value' => null,
            'new_value' => $product->name . ' (' . $product->sku . ')',
            'ip_address' => request()->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => $product->load(['category', 'brand', 'unit', 'status']),
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'sku' => 'sometimes|required|string|max:100|unique:products,sku,' . $id,
            'barcode' => 'nullable|string|max:100|unique:products,barcode,' . $id,
            'product_type' => 'nullable|string',
            'product_code' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'unit_id' => 'sometimes|required|exists:units,id',
            'cost_price' => 'nullable|numeric|min:0',
            'selling_price' => 'sometimes|required|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'vip_price' => 'nullable|numeric|min:0',
            'member_price' => 'nullable|numeric|min:0',
            'online_price' => 'nullable|numeric|min:0',
            'landed_cost' => 'nullable|numeric|min:0',
            'shipping_cost' => 'nullable|numeric|min:0',
            'import_tax' => 'nullable|numeric|min:0',
            'handling_cost' => 'nullable|numeric|min:0',
            'other_expenses' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0',
            'min_stock' => 'nullable|numeric|min:0',
            'max_stock' => 'nullable|numeric|min:0',
            'safety_stock' => 'nullable|numeric|min:0',
            'opening_stock' => 'nullable|numeric|min:0',
            'reorder_level' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'gallery_images' => 'nullable|array',
            'tags' => 'nullable|array',
            'weight' => 'nullable|numeric',
            'dimensions' => 'nullable|string',
            'seo_slug' => 'nullable|string',
            'seo_title' => 'nullable|string',
            'seo_description' => 'nullable|string',
            'is_featured' => 'nullable|boolean',
            'is_new' => 'nullable|boolean',
            'is_discontinued' => 'nullable|boolean',
            'visibility' => 'nullable|array',
            'status_id' => 'nullable|exists:sys_statuses,id',
        ]);

        if (isset($validated['selling_price']) && (float)$validated['selling_price'] !== (float)$product->selling_price) {
            ProductPriceHistory::create([
                'product_id' => $product->id,
                'price_type' => 'RETAIL',
                'old_price' => $product->selling_price,
                'new_price' => $validated['selling_price'],
                'change_reason' => $request->get('change_reason', 'Standard Catalog Price Update'),
                'changed_by' => auth()->id() ?? 1,
            ]);
        }

        $oldName = $product->name;
        $product->update($validated);

        ProductAuditLog::create([
            'product_id' => $product->id,
            'user_id' => auth()->id() ?? 1,
            'action' => 'PRODUCT_UPDATED',
            'field_name' => 'catalog_fields',
            'old_value' => $oldName,
            'new_value' => $product->name,
            'ip_address' => request()->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => $product->load(['category', 'brand', 'unit', 'status']),
        ]);
    }

    public function duplicate($id): JsonResponse
    {
        $original = Product::findOrFail($id);
        $replica = $original->replicate();
        $replica->name = $original->name . ' (Copy)';
        $replica->sku = $original->sku . '-COPY-' . strtoupper(Str::random(3));
        $replica->barcode = null;
        $replica->seo_slug = Str::slug($replica->name) . '-' . strtolower(Str::random(4));
        $replica->created_at = Carbon::now();
        $replica->save();

        ProductAuditLog::create([
            'product_id' => $replica->id,
            'user_id' => auth()->id() ?? 1,
            'action' => 'PRODUCT_DUPLICATED',
            'field_name' => 'id',
            'old_value' => (string)$original->id,
            'new_value' => (string)$replica->id,
            'ip_address' => request()->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product duplicated successfully',
            'data' => $replica->load(['category', 'brand', 'unit']),
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->delete();

        ProductAuditLog::create([
            'product_id' => $id,
            'user_id' => auth()->id() ?? 1,
            'action' => 'PRODUCT_DELETED',
            'field_name' => 'soft_delete',
            'old_value' => 'active',
            'new_value' => 'deleted',
            'ip_address' => request()->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product archived/deleted successfully',
        ]);
    }
}