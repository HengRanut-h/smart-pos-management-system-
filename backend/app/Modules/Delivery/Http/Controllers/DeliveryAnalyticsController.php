<?php

namespace App\Modules\Delivery\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Modules\Delivery\Persistence\Models\Delivery;
use App\Modules\Delivery\Persistence\Models\DeliveryDriver;
use App\Modules\Delivery\Persistence\Models\DeliveryZone;

class DeliveryAnalyticsController extends Controller
{
    public function index(): JsonResponse
    {
        $totalOrders = Delivery::count();
        $successful = Delivery::whereIn('status', ['DELIVERED', 'COMPLETED'])->count();
        $failed = Delivery::where('status', 'FAILED')->count();
        $returned = Delivery::where('status', 'RETURNED_TO_STORE')->count();
        $inTransit = Delivery::whereIn('status', ['IN_TRANSIT', 'PICKED_UP', 'ARRIVED'])->count();

        $conversionRate = $totalOrders > 0 ? round(($successful / $totalOrders) * 100, 1) : 0;
        $failedRate = $totalOrders > 0 ? round(($failed / $totalOrders) * 100, 1) : 0;
        $returnRate = $totalOrders > 0 ? round(($returned / $totalOrders) * 100, 1) : 0;

        $totalRevenue = Delivery::sum('total_amount');
        $totalFees = Delivery::sum('delivery_fee');
        $avgDeliveryMinutes = round(Delivery::whereNotNull('actual_delivery_minutes')->avg('actual_delivery_minutes') ?: 32);

        // Peak delivery hours simulation
        $hourlyDistribution = [
            ['hour' => '08:00 - 10:00', 'count' => 14, 'percentage' => 15],
            ['hour' => '10:00 - 12:00', 'count' => 28, 'percentage' => 30],
            ['hour' => '12:00 - 14:00', 'count' => 22, 'percentage' => 24],
            ['hour' => '14:00 - 17:00', 'count' => 18, 'percentage' => 19],
            ['hour' => '17:00 - 20:00', 'count' => 11, 'percentage' => 12],
        ];

        // Zone volume heatmap
        $zoneHeatmap = DeliveryZone::withCount('deliveries')->get()->map(function ($z) {
            return [
                'zone_name' => $z->name,
                'code' => $z->code,
                'deliveries_count' => $z->deliveries_count,
                'avg_minutes' => $z->estimated_delivery_minutes,
                'base_fee' => $z->base_delivery_fee,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'funnel' => [
                    'total_orders' => $totalOrders,
                    'in_transit' => $inTransit,
                    'successful' => $successful,
                    'failed' => $failed,
                    'returned' => $returned,
                    'conversion_rate' => $conversionRate,
                    'failed_rate' => $failedRate,
                    'return_rate' => $returnRate,
                ],
                'financial_performance' => [
                    'total_revenue' => (float) $totalRevenue,
                    'total_delivery_fees' => (float) $totalFees,
                    'avg_order_value' => $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0,
                    'avg_delivery_minutes' => $avgDeliveryMinutes,
                    'cost_per_delivery' => 1.25,
                    'profit_per_delivery' => round(($totalFees / max(1, $totalOrders)) - 1.25, 2),
                ],
                'hourly_distribution' => $hourlyDistribution,
                'zone_heatmap' => $zoneHeatmap,
            ],
        ]);
    }
}
