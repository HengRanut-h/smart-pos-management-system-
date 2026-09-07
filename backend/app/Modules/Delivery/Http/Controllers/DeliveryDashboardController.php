<?php

namespace App\Modules\Delivery\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Modules\Delivery\Persistence\Models\Delivery;
use App\Modules\Delivery\Persistence\Models\DeliveryDriver;
use App\Modules\Delivery\Persistence\Models\DeliveryZone;
use Carbon\Carbon;

class DeliveryDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $today = Carbon::today();

        $totalDeliveries = Delivery::count();
        $pending = Delivery::where('status', 'PENDING')->count();
        $assigned = Delivery::where('status', 'ASSIGNED')->count();
        $pickedUp = Delivery::where('status', 'PICKED_UP')->count();
        $inTransit = Delivery::where('status', 'IN_TRANSIT')->count();
        $delivered = Delivery::where('status', 'DELIVERED')->count();
        $failed = Delivery::whereIn('status', ['FAILED', 'CANCELLED', 'RETURNED_TO_STORE'])->count();

        $totalCodDue = Delivery::where('payment_type', 'COD')->sum('cod_amount_due');
        $totalCodCollected = Delivery::where('payment_type', 'COD')->sum('cod_amount_collected');
        $totalDeliveryFees = Delivery::sum('delivery_fee');

        $activeDrivers = DeliveryDriver::whereIn('current_status', ['AVAILABLE', 'ON_DELIVERY'])->count();
        $totalDrivers = DeliveryDriver::count();
        $totalZones = DeliveryZone::where('is_active', true)->count();

        // Today's summary
        $todayDeliveries = Delivery::whereDate('created_at', $today)->count();
        $todayDelivered = Delivery::whereDate('delivered_at', $today)->count();
        $successRate = $totalDeliveries > 0 ? round(($delivered / $totalDeliveries) * 100, 1) : 100.0;

        // Recent deliveries
        $recentDeliveries = Delivery::with(['driver', 'zone', 'customer'])
            ->orderBy('created_at', 'desc')
            ->limit(8)
            ->get();

        return response()->json([
            'success' => true,
            'metrics' => [
                'total_deliveries' => $totalDeliveries,
                'pending' => $pending,
                'assigned' => $assigned,
                'picked_up' => $pickedUp,
                'in_transit' => $inTransit,
                'delivered' => $delivered,
                'failed' => $failed,
                'cod_collected' => (float)$totalCodCollected,
                'cod_pending' => (float)max(0, $totalCodDue - $totalCodCollected),
                'total_delivery_fees' => (float)$totalDeliveryFees,
                'active_drivers' => $activeDrivers,
                'total_drivers' => $totalDrivers,
                'total_zones' => $totalZones,
                'success_rate' => $successRate,
                'today_deliveries' => $todayDeliveries,
                'today_delivered' => $todayDelivered,
            ],
            'recent_deliveries' => $recentDeliveries,
        ]);
    }
}
