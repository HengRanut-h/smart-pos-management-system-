<?php

namespace App\Modules\Brand\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Brand\Persistence\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    public function index(): JsonResponse
    {
        $brands = Brand::query()
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $brands,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'website' => 'nullable|string|max:255',
            'logo_path' => 'nullable|string|max:255',
            'status_id' => 'nullable|integer',
        ]);

        if (empty($validated['code'])) {
            $validated['code'] = 'BRD-' . strtoupper(Str::random(6));
        }
        $validated['status_id'] = $validated['status_id'] ?? 1;

        $brand = Brand::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Brand created successfully',
            'data' => $brand,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'website' => 'nullable|string|max:255',
            'logo_path' => 'nullable|string|max:255',
            'status_id' => 'nullable|integer',
        ]);

        $brand->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Brand updated successfully',
            'data' => $brand,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);
        $brand->delete();

        return response()->json([
            'success' => true,
            'message' => 'Brand deleted successfully',
        ]);
    }
}
