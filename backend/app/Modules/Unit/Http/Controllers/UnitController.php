<?php

namespace App\Modules\Unit\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Unit\Persistence\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UnitController extends Controller
{
    public function index(): JsonResponse
    {
        $units = Unit::query()
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $units,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:50',
            'symbol' => 'nullable|string|max:20',
            'decimal_places' => 'nullable|integer|min:0|max:6',
            'status_id' => 'nullable|integer',
        ]);

        if (empty($validated['code'])) {
            $validated['code'] = 'UNT-' . strtoupper(Str::random(5));
        }
        $validated['status_id'] = $validated['status_id'] ?? 1;
        $validated['decimal_places'] = $validated['decimal_places'] ?? 2;

        $unit = Unit::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Unit created successfully',
            'data' => $unit,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $unit = Unit::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'code' => 'nullable|string|max:50',
            'symbol' => 'nullable|string|max:20',
            'decimal_places' => 'nullable|integer|min:0|max:6',
            'status_id' => 'nullable|integer',
        ]);

        $unit->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Unit updated successfully',
            'data' => $unit,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $unit = Unit::findOrFail($id);
        $unit->delete();

        return response()->json([
            'success' => true,
            'message' => 'Unit deleted successfully',
        ]);
    }
}
