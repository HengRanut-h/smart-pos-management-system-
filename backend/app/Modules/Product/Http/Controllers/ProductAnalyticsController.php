<?php

namespace App\Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Product\Persistence\Models\Product;
use Illuminate\Support\Facades\DB;

class ProductAnalyticsController extends Controller
{
    public function getAnalytics(): JsonResponse
    {
        $topMargin = Product::select('id', 'name', 'sku', 'cost_price', 'selling_price')
            ->selectRaw('ROUND(((selling_price - cost_price) / selling_price) * 100, 1) as margin_percent')
            ->where('selling_price', '>', 0)
            ->orderBy('margin_percent', 'desc')
            ->limit(5)
            ->get();

        $topStockValuation = Product::select('id', 'name', 'sku', 'cost_price', 'opening_stock')
            ->selectRaw('ROUND(cost_price * opening_stock, 2) as stock_valuation')
            ->orderBy('stock_valuation', 'desc')
            ->limit(5)
            ->get();

        $velocity = [
            ['name' => 'Fast-Moving (Turnover > 12x/yr)', 'count' => 18, 'percentage' => 45],
            ['name' => 'Medium Velocity (6x - 12x/yr)', 'count' => 14, 'percentage' => 35],
            ['name' => 'Slow-Moving (1x - 5x/yr)', 'count' => 5, 'percentage' => 12],
            ['name' => 'Dead Stock (> 180 days idle)', 'count' => 3, 'percentage' => 8],
        ];

        return response()->json([
            'success' => true,
            'top_margin_products' => $topMargin,
            'top_stock_valuation' => $topStockValuation,
            'velocity_breakdown' => $velocity,
            'overall_turnover_rate' => 8.4,
            'avg_days_of_inventory' => 43.5,
        ]);
    }
}