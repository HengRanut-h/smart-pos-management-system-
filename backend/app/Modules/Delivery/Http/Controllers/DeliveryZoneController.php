<?php

namespace App\Modules\Delivery\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Delivery\Persistence\Models\DeliveryZone;

class DeliveryZoneController extends Controller
{
    public function index(): JsonResponse
    {
        $zones = DeliveryZone::withCount('deliveries')
            ->orderBy('is_active', 'desc')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'zones' => $zones,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:delivery_zones,code',
            'area_description' => 'nullable|string',
            'base_delivery_fee' => 'required|numeric|min:0',
            'per_km_fee' => 'nullable|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'free_delivery_threshold' => 'nullable|numeric|min:0',
            'estimated_delivery_minutes' => 'nullable|integer|min:5',
        ]);

        $zone = DeliveryZone::create([
            'name' => $validated['name'],
            'code' => strtoupper($validated['code']),
            'area_description' => $validated['area_description'] ?? null,
            'base_delivery_fee' => $validated['base_delivery_fee'],
            'per_km_fee' => $validated['per_km_fee'] ?? 0,
            'min_order_amount' => $validated['min_order_amount'] ?? 0,
            'free_delivery_threshold' => $validated['free_delivery_threshold'] ?? null,
            'estimated_delivery_minutes' => $validated['estimated_delivery_minutes'] ?? 30,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Delivery zone created successfully',
            'zone' => $zone,
        ], 201);
    }
}
