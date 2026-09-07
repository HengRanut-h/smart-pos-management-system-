<?php

namespace App\Modules\Delivery\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Delivery\Persistence\Models\DeliveryTimeSlot;

class DeliveryTimeSlotController extends Controller
{
    public function index(): JsonResponse
    {
        $slots = DeliveryTimeSlot::orderBy('start_time', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $slots,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'slot_code' => 'required|string|unique:delivery_time_slots,slot_code',
            'label' => 'required|string',
            'start_time' => 'required',
            'end_time' => 'required',
            'max_capacity' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $slot = DeliveryTimeSlot::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Delivery time slot created',
            'data' => $slot,
        ], 201);
    }
}
