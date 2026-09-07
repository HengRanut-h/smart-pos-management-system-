<?php

namespace App\Modules\Delivery\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Delivery\Persistence\Models\DeliveryDriver;
use App\Modules\Employee\Persistence\Models\Employee;

class DeliveryStaffController extends Controller
{
    public function index(): JsonResponse
    {
        $drivers = DeliveryDriver::with(['employee'])
            ->withCount(['deliveries as active_deliveries_count' => function ($q) {
                $q->whereIn('status', ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED']);
            }])
            ->orderBy('is_active', 'desc')
            ->orderBy('name', 'asc')
            ->get();

        $employees = Employee::where('is_active', true)->select('id', 'name', 'phone', 'email', 'avatar_url')->get();

        return response()->json([
            'success' => true,
            'drivers' => $drivers,
            'eligible_employees' => $employees,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'nullable|exists:employees,id',
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:50',
            'vehicle_type' => 'required|string|in:MOTORCYCLE,BICYCLE,CAR,VAN,TRUCK',
            'vehicle_plate_number' => 'nullable|string|max:50',
            'driver_license_number' => 'nullable|string|max:50',
            'driver_license_expiry' => 'nullable|date',
            'current_status' => 'nullable|string|in:AVAILABLE,BUSY,ON_DELIVERY,OFFLINE,BREAK',
        ]);

        $driver = DeliveryDriver::create([
            'employee_id' => $validated['employee_id'] ?? null,
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'vehicle_type' => $validated['vehicle_type'],
            'vehicle_plate_number' => $validated['vehicle_plate_number'] ?? null,
            'driver_license_number' => $validated['driver_license_number'] ?? null,
            'driver_license_expiry' => $validated['driver_license_expiry'] ?? null,
            'current_status' => $validated['current_status'] ?? 'AVAILABLE',
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Delivery driver registered successfully',
            'driver' => $driver->load('employee'),
        ], 201);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'current_status' => 'required|string|in:AVAILABLE,BUSY,ON_DELIVERY,OFFLINE,BREAK',
        ]);

        $driver = DeliveryDriver::findOrFail($id);
        $driver->current_status = $validated['current_status'];
        $driver->save();

        return response()->json([
            'success' => true,
            'message' => 'Driver status updated to ' . $driver->current_status,
            'driver' => $driver,
        ]);
    }
}
