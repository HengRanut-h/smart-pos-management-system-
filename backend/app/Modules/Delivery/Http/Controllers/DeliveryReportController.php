<?php

namespace App\Modules\Delivery\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Modules\Delivery\Persistence\Models\Delivery;
use App\Modules\Delivery\Persistence\Models\DeliveryDriver;
use App\Modules\Delivery\Persistence\Models\DeliveryZone;
use Illuminate\Support\Facades\DB;

class DeliveryReportController extends Controller
{
    public function index(): JsonResponse
    {
        // By Status
        $byStatus = Delivery::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        // By Driver Performance
        $driverPerformance = DeliveryDriver::select('id', 'name', 'vehicle_type', 'rating', 'total_deliveries_completed', 'active_cash_in_hand')
            ->withCount(['deliveries as total_assigned_count'])
            ->get();

        // By Zone
        $zoneBreakdown = DeliveryZone::withCount('deliveries')
            ->get();

        // Failure Reasons
        $failureBreakdown = Delivery::whereNotNull('failure_reason_code')
            ->select('failure_reason_code', DB::raw('count(*) as count'))
            ->groupBy('failure_reason_code')
            ->get();

        return response()->json([
            'success' => true,
            'by_status' => $byStatus,
            'driver_performance' => $driverPerformance,
            'zone_breakdown' => $zoneBreakdown,
            'failure_breakdown' => $failureBreakdown,
        ]);
    }
}
