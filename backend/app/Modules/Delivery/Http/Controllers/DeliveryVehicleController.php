<?php

namespace App\Modules\Delivery\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Delivery\Persistence\Models\DeliveryVehicle;
use App\Modules\Delivery\Persistence\Models\DeliveryVehicleMaintenance;

class DeliveryVehicleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DeliveryVehicle::with(['assignedDriver', 'maintenanceLogs']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('vehicle_type')) {
            $query->where('vehicle_type', $request->vehicle_type);
        }

        $vehicles = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $vehicles,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plate_number' => 'required|string|unique:delivery_vehicles,plate_number',
            'vehicle_type' => 'required|string',
            'brand' => 'nullable|string',
            'model' => 'nullable|string',
            'color' => 'nullable|string',
            'capacity_kg' => 'nullable|numeric',
            'fuel_type' => 'nullable|string',
            'assigned_driver_id' => 'nullable|exists:delivery_drivers,id',
            'status' => 'nullable|string',
            'mileage_km' => 'nullable|numeric',
            'next_service_date' => 'nullable|date',
        ]);

        $vehicle = DeliveryVehicle::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle registered successfully',
            'data' => $vehicle->load('assignedDriver'),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $vehicle = DeliveryVehicle::findOrFail($id);
        $data = $request->validate([
            'plate_number' => 'sometimes|string|unique:delivery_vehicles,plate_number,' . $id,
            'vehicle_type' => 'sometimes|string',
            'brand' => 'nullable|string',
            'model' => 'nullable|string',
            'color' => 'nullable|string',
            'capacity_kg' => 'nullable|numeric',
            'fuel_type' => 'nullable|string',
            'assigned_driver_id' => 'nullable|exists:delivery_drivers,id',
            'status' => 'nullable|string',
            'mileage_km' => 'nullable|numeric',
            'next_service_date' => 'nullable|date',
        ]);

        $vehicle->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle updated successfully',
            'data' => $vehicle->load('assignedDriver'),
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $vehicle = DeliveryVehicle::findOrFail($id);
        $request->validate(['status' => 'required|string']);
        $vehicle->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle status updated to ' . $request->status,
            'data' => $vehicle,
        ]);
    }

    public function addMaintenance(Request $request, int $id): JsonResponse
    {
        $vehicle = DeliveryVehicle::findOrFail($id);
        $data = $request->validate([
            'service_type' => 'required|string',
            'service_date' => 'required|date',
            'cost' => 'required|numeric',
            'mileage_at_service' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'technician_name' => 'nullable|string',
        ]);

        $data['vehicle_id'] = $vehicle->id;
        $log = DeliveryVehicleMaintenance::create($data);

        if (!empty($data['mileage_at_service'])) {
            $vehicle->update(['mileage_km' => $data['mileage_at_service']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Maintenance record logged',
            'data' => $log,
        ], 201);
    }
}
