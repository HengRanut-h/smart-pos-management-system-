<?php

namespace App\Modules\Delivery\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Delivery\Persistence\Models\DriverCodSettlement;
use App\Modules\Delivery\Persistence\Models\DeliveryDriver;
use Illuminate\Support\Facades\DB;

class DeliveryCodSettlementController extends Controller
{
    public function index(): JsonResponse
    {
        $settlements = DriverCodSettlement::with(['driver', 'settledBy'])
            ->orderBy('created_at', 'desc')
            ->get();

        $driverCashBalances = DeliveryDriver::select('id', 'name', 'phone', 'vehicle_type', 'active_cash_in_hand', 'current_status')
            ->where('active_cash_in_hand', '>', 0)
            ->get();

        return response()->json([
            'success' => true,
            'settlements' => $settlements,
            'drivers_with_cash' => $driverCashBalances,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'driver_id' => 'required|exists:delivery_drivers,id',
            'amount_to_settle' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $driver = DeliveryDriver::findOrFail($validated['driver_id']);
            $settleAmount = (float)$validated['amount_to_settle'];

            $settlementNum = 'SETTLE-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));

            $settlement = DriverCodSettlement::create([
                'settlement_number' => $settlementNum,
                'driver_id' => $driver->id,
                'total_cod_collected' => $settleAmount,
                'total_delivery_fees' => 0,
                'net_amount_settled' => $settleAmount,
                'settlement_status' => 'RECONCILED',
                'settled_by_user_id' => auth()->id(),
                'notes' => $validated['notes'] ?? 'Cash settled at register/headquarters',
                'settled_at' => now(),
            ]);

            $driver->active_cash_in_hand = max(0, (float)$driver->active_cash_in_hand - $settleAmount);
            $driver->save();

            return response()->json([
                'success' => true,
                'message' => 'Driver COD settled successfully',
                'settlement' => $settlement->load(['driver', 'settledBy']),
                'remaining_cash_in_hand' => (float)$driver->active_cash_in_hand,
            ]);
        });
    }
}
