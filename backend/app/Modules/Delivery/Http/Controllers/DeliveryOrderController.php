<?php

namespace App\Modules\Delivery\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Delivery\Persistence\Models\Delivery;
use App\Modules\Delivery\Persistence\Models\DeliveryItem;
use App\Modules\Delivery\Persistence\Models\DeliveryTrackingLog;
use App\Modules\Delivery\Persistence\Models\DeliveryProof;
use App\Modules\Delivery\Persistence\Models\DeliveryDriver;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DeliveryOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Delivery::with(['driver', 'zone', 'customer', 'items', 'proof']);

        if ($request->filled('status') && $request->status !== 'ALL') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $s = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('delivery_number', 'like', $s)
                  ->orWhere('recipient_name', 'like', $s)
                  ->orWhere('recipient_phone', 'like', $s)
                  ->orWhere('delivery_address', 'like', $s);
            });
        }

        if ($request->filled('driver_id')) {
            $query->where('driver_id', $request->driver_id);
        }

        if ($request->filled('zone_id')) {
            $query->where('zone_id', $request->zone_id);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        $deliveries = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $deliveries,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recipient_name' => 'required|string|max:255',
            'recipient_phone' => 'required|string|max:50',
            'recipient_secondary_phone' => 'nullable|string|max:50',
            'delivery_address' => 'required|string',
            'delivery_notes' => 'nullable|string',
            'priority' => 'nullable|string',
            'payment_type' => 'nullable|string',
            'cod_amount_due' => 'nullable|numeric|min:0',
            'delivery_fee' => 'nullable|numeric|min:0',
            'order_subtotal' => 'nullable|numeric|min:0',
            'zone_id' => 'nullable|exists:delivery_zones,id',
            'driver_id' => 'nullable|exists:delivery_drivers,id',
            'customer_id' => 'nullable|exists:customers,id',
            'sale_id' => 'nullable|exists:sales,id',
            'items' => 'nullable|array',
            'items.*.product_name' => 'required|string',
            'items.*.product_id' => 'nullable|integer',
            'items.*.sku' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.image_url' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $deliveryNum = 'DEL-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));

            $subtotal = $validated['order_subtotal'] ?? 0;
            $fee = $validated['delivery_fee'] ?? 0;
            $total = $subtotal + $fee;
            $codDue = ($validated['payment_type'] ?? 'COD') === 'COD' ? ($validated['cod_amount_due'] ?? $total) : 0;

            $initialStatus = !empty($validated['driver_id']) ? 'ASSIGNED' : 'PENDING';

            $delivery = Delivery::create([
                'delivery_number' => $deliveryNum,
                'recipient_name' => $validated['recipient_name'],
                'recipient_phone' => $validated['recipient_phone'],
                'recipient_secondary_phone' => $validated['recipient_secondary_phone'] ?? null,
                'delivery_address' => $validated['delivery_address'],
                'delivery_notes' => $validated['delivery_notes'] ?? null,
                'priority' => $validated['priority'] ?? 'STANDARD',
                'payment_type' => $validated['payment_type'] ?? 'COD',
                'cod_amount_due' => $codDue,
                'cod_amount_collected' => 0,
                'delivery_fee' => $fee,
                'order_subtotal' => $subtotal,
                'total_amount' => $total,
                'zone_id' => $validated['zone_id'] ?? null,
                'driver_id' => $validated['driver_id'] ?? null,
                'customer_id' => $validated['customer_id'] ?? null,
                'sale_id' => $validated['sale_id'] ?? null,
                'status' => $initialStatus,
                'assigned_at' => !empty($validated['driver_id']) ? now() : null,
                'estimated_delivery_time' => '30-45 mins',
            ]);

            // Items
            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    DeliveryItem::create([
                        'delivery_id' => $delivery->id,
                        'product_id' => $item['product_id'] ?? null,
                        'product_name' => $item['product_name'],
                        'sku' => $item['sku'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'total_price' => $item['unit_price'] * $item['quantity'],
                        'image_url' => $item['image_url'] ?? null,
                    ]);
                }
            }

            // Tracking log
            DeliveryTrackingLog::create([
                'delivery_id' => $delivery->id,
                'status' => 'PENDING',
                'actor_type' => 'DISPATCHER',
                'actor_name' => auth()->user()?->name ?? 'System Dispatcher',
                'notes' => 'Delivery order registered',
            ]);

            if (!empty($validated['driver_id'])) {
                $driver = DeliveryDriver::find($validated['driver_id']);
                DeliveryTrackingLog::create([
                    'delivery_id' => $delivery->id,
                    'status' => 'ASSIGNED',
                    'actor_type' => 'DISPATCHER',
                    'actor_name' => auth()->user()?->name ?? 'System Dispatcher',
                    'notes' => 'Assigned to driver ' . ($driver?->name ?? 'Driver #' . $validated['driver_id']),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Delivery order created successfully',
                'delivery' => $delivery->load(['driver', 'zone', 'customer', 'items']),
            ], 201);
        });
    }

    public function show(int $id): JsonResponse
    {
        $delivery = Delivery::with(['driver.employee', 'zone', 'customer', 'items', 'trackingLogs', 'proof', 'sale'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'delivery' => $delivery,
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:PENDING,ASSIGNED,ACCEPTED,PICKED_UP,IN_TRANSIT,ARRIVED,DELIVERED,FAILED,CANCELLED,RETURNED_TO_STORE',
            'notes' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $delivery = Delivery::findOrFail($id);
        $oldStatus = $delivery->status;
        $delivery->status = $validated['status'];

        if ($validated['status'] === 'PICKED_UP' && !$delivery->picked_up_at) {
            $delivery->picked_up_at = now();
        } elseif ($validated['status'] === 'DELIVERED') {
            $delivery->delivered_at = now();
            if ($delivery->picked_up_at) {
                $delivery->actual_delivery_minutes = (int)Carbon::parse($delivery->picked_up_at)->diffInMinutes(now());
            }
            if ($delivery->payment_type === 'COD') {
                $delivery->cod_amount_collected = $delivery->cod_amount_due;
                if ($delivery->driver_id) {
                    DeliveryDriver::where('id', $delivery->driver_id)->increment('active_cash_in_hand', (float)$delivery->cod_amount_due);
                    DeliveryDriver::where('id', $delivery->driver_id)->increment('total_deliveries_completed', 1);
                }
            }
        }

        $delivery->save();

        DeliveryTrackingLog::create([
            'delivery_id' => $delivery->id,
            'status' => $validated['status'],
            'actor_type' => 'DISPATCHER',
            'actor_name' => auth()->user()?->name ?? 'System Dispatcher',
            'notes' => $validated['notes'] ?? ('Status transitioned from ' . $oldStatus . ' to ' . $validated['status']),
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Delivery status updated to ' . $validated['status'],
            'delivery' => $delivery->load(['driver', 'zone', 'customer', 'trackingLogs', 'proof']),
        ]);
    }

    public function assignDriver(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'driver_id' => 'required|exists:delivery_drivers,id',
            'notes' => 'nullable|string',
        ]);

        $delivery = Delivery::findOrFail($id);
        $driver = DeliveryDriver::findOrFail($validated['driver_id']);

        $delivery->driver_id = $driver->id;
        $delivery->status = 'ASSIGNED';
        $delivery->assigned_at = now();
        $delivery->save();

        $driver->current_status = 'ON_DELIVERY';
        $driver->save();

        DeliveryTrackingLog::create([
            'delivery_id' => $delivery->id,
            'status' => 'ASSIGNED',
            'actor_type' => 'DISPATCHER',
            'actor_name' => auth()->user()?->name ?? 'System Dispatcher',
            'notes' => 'Dispatched to driver ' . $driver->name . ' (' . $driver->vehicle_type . ' ' . ($driver->vehicle_plate_number ?? '') . ')',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Driver assigned successfully',
            'delivery' => $delivery->load(['driver', 'zone', 'customer', 'trackingLogs']),
        ]);
    }

    public function submitProof(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'receiver_name' => 'required|string',
            'receiver_relationship' => 'nullable|string',
            'signature_image_url' => 'nullable|string',
            'delivery_photo_url' => 'nullable|string',
            'otp_code' => 'nullable|string',
            'delivered_latitude' => 'nullable|numeric',
            'delivered_longitude' => 'nullable|numeric',
            'cod_collected' => 'nullable|numeric',
        ]);

        $delivery = Delivery::findOrFail($id);

        $proof = DeliveryProof::updateOrCreate(
            ['delivery_id' => $delivery->id],
            [
                'receiver_name' => $validated['receiver_name'],
                'receiver_relationship' => $validated['receiver_relationship'] ?? 'SELF',
                'signature_image_url' => $validated['signature_image_url'] ?? null,
                'delivery_photo_url' => $validated['delivery_photo_url'] ?? null,
                'otp_code' => $validated['otp_code'] ?? null,
                'otp_verified_at' => !empty($validated['otp_code']) ? now() : null,
                'delivered_latitude' => $validated['delivered_latitude'] ?? null,
                'delivered_longitude' => $validated['delivered_longitude'] ?? null,
            ]
        );

        $delivery->status = 'DELIVERED';
        $delivery->delivered_at = now();
        if ($delivery->payment_type === 'COD') {
            $collected = $validated['cod_collected'] ?? $delivery->cod_amount_due;
            $delivery->cod_amount_collected = $collected;
            if ($delivery->driver_id) {
                DeliveryDriver::where('id', $delivery->driver_id)->increment('active_cash_in_hand', (float)$collected);
                DeliveryDriver::where('id', $delivery->driver_id)->increment('total_deliveries_completed', 1);
            }
        }
        $delivery->save();

        DeliveryTrackingLog::create([
            'delivery_id' => $delivery->id,
            'status' => 'DELIVERED',
            'actor_type' => 'DRIVER',
            'actor_name' => $delivery->driver?->name ?? 'Delivery Driver',
            'notes' => 'Proof of delivery recorded by ' . $validated['receiver_name'] . ' (' . ($validated['receiver_relationship'] ?? 'SELF') . ')',
            'latitude' => $validated['delivered_latitude'] ?? null,
            'longitude' => $validated['delivered_longitude'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Proof of delivery submitted and marked as delivered',
            'delivery' => $delivery->load(['driver', 'zone', 'customer', 'trackingLogs', 'proof']),
        ]);
    }

    public function markFailed(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'failure_reason_code' => 'required|string|in:CUSTOMER_UNAVAILABLE,WRONG_ADDRESS,CUSTOMER_REJECTED,PHONE_UNREACHABLE,PAYMENT_ISSUE,DAMAGED_ITEM',
            'failure_notes' => 'nullable|string',
            'action' => 'required|string|in:RESCHEDULE,RETURN_TO_STORE',
            'reschedule_date' => 'nullable|date',
        ]);

        $delivery = Delivery::findOrFail($id);
        $delivery->failure_reason_code = $validated['failure_reason_code'];
        $delivery->failure_notes = $validated['failure_notes'] ?? null;

        if ($validated['action'] === 'RESCHEDULE') {
            $delivery->status = 'PENDING';
            $delivery->reschedule_count += 1;
            $delivery->scheduled_at = !empty($validated['reschedule_date']) ? Carbon::parse($validated['reschedule_date']) : now()->addDay();
        } else {
            $delivery->status = 'RETURNED_TO_STORE';
        }

        $delivery->save();

        DeliveryTrackingLog::create([
            'delivery_id' => $delivery->id,
            'status' => $delivery->status,
            'actor_type' => 'DRIVER',
            'actor_name' => $delivery->driver?->name ?? 'Delivery Driver',
            'notes' => 'Delivery attempt failed (' . $validated['failure_reason_code'] . '). Action: ' . $validated['action'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Delivery marked as ' . $delivery->status,
            'delivery' => $delivery->load(['driver', 'zone', 'customer', 'trackingLogs']),
        ]);
    }
}
