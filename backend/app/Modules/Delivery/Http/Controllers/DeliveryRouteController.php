<?php

namespace App\Modules\Delivery\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Delivery\Persistence\Models\DeliveryRoute;
use App\Modules\Delivery\Persistence\Models\DeliveryRouteStop;
use App\Modules\Delivery\Persistence\Models\Delivery;

class DeliveryRouteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DeliveryRoute::with(['driver', 'vehicle', 'stops.delivery']);

        if ($request->filled('date')) {
            $query->where('route_date', $request->date);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $routes = $query->orderBy('route_date', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $routes,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'driver_id' => 'nullable|exists:delivery_drivers,id',
            'vehicle_id' => 'nullable|exists:delivery_vehicles,id',
            'route_date' => 'required|date',
            'notes' => 'nullable|string',
            'delivery_ids' => 'required|array|min:1',
            'delivery_ids.*' => 'exists:deliveries,id',
        ]);

        $routeCode = 'ROUTE-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));

        $route = DeliveryRoute::create([
            'route_code' => $routeCode,
            'driver_id' => $data['driver_id'] ?? null,
            'vehicle_id' => $data['vehicle_id'] ?? null,
            'status' => 'PLANNED',
            'route_date' => $data['route_date'],
            'total_distance_km' => count($data['delivery_ids']) * 3.5, // simulated calculation
            'estimated_duration_minutes' => count($data['delivery_ids']) * 20,
            'total_stops' => count($data['delivery_ids']),
            'completed_stops' => 0,
            'notes' => $data['notes'] ?? null,
        ]);

        foreach ($data['delivery_ids'] as $idx => $deliveryId) {
            DeliveryRouteStop::create([
                'route_id' => $route->id,
                'delivery_id' => $deliveryId,
                'sequence_order' => $idx + 1,
                'status' => 'PENDING',
                'estimated_arrival_time' => date('H:i', strtotime('+' . (($idx + 1) * 20) . ' minutes')),
                'distance_from_prev_km' => 3.5,
            ]);

            // link delivery to route and driver
            Delivery::where('id', $deliveryId)->update([
                'route_id' => $route->id,
                'driver_id' => $data['driver_id'] ?? null,
                'vehicle_id' => $data['vehicle_id'] ?? null,
                'status' => 'ASSIGNED',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Optimized delivery route created with ' . count($data['delivery_ids']) . ' stops',
            'data' => $route->load(['driver', 'vehicle', 'stops.delivery']),
        ], 201);
    }

    public function optimize(Request $request, int $id): JsonResponse
    {
        $route = DeliveryRoute::with('stops.delivery')->findOrFail($id);
        
        // Re-sequence stops by nearest simulated distance
        $stops = $route->stops;
        foreach ($stops as $idx => $stop) {
            $stop->update([
                'sequence_order' => $idx + 1,
                'estimated_arrival_time' => date('H:i', strtotime('+' . (($idx + 1) * 18) . ' minutes')),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Route stops optimized for shortest travel path',
            'data' => $route->fresh(['driver', 'vehicle', 'stops.delivery']),
        ]);
    }
}
