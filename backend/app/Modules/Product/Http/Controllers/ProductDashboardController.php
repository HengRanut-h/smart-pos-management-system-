<?php

namespace App\Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\Product\Persistence\Models\ProductVariant;
use App\Modules\Product\Persistence\Models\ProductBatch;
use App\Modules\Category\Persistence\Models\Category;
use App\Modules\Brand\Persistence\Models\Brand;
use App\Modules\Supplier\Persistence\Models\Supplier;
use App\Modules\Warehouse\Persistence\Models\Warehouse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ProductDashboardController extends Controller
{
    public function getDashboard(): JsonResponse
    {
        $totalProducts = Product::count();
        $activeProducts = Product::where('status_id', 1)->count();
        $inactiveProducts = Product::where('status_id', 2)->count();
        $draftProducts = Product::where('status_id', 3)->orWhereNull('status_id')->count();

        // Stock status checks
        $outOfStock = Product::where(function ($q) {
            $q->where('opening_stock', '<=', 0)
              ->orWhereNull('opening_stock');
        })->count();

        $lowStock = Product::whereColumn('min_stock', '>', 'opening_stock')->count();
        $featured = Product::where('is_featured', true)->count();
        $newProducts = Product::where('is_new', true)->count();
        $discontinued = Product::where('is_discontinued', true)->count();

        // Expiry alerts
        $now = Carbon::now();
        $in30Days = Carbon::now()->addDays(30);
        $expiredCount = ProductBatch::where('expiry_date', '<', $now)->count();
        $expiringSoonCount = ProductBatch::whereBetween('expiry_date', [$now, $in30Days])->count();

        // Financials
        $products = Product::select('cost_price', 'selling_price', 'opening_stock', 'landed_cost')->get();
        $totalCost = 0;
        $totalStockValue = 0;
        $potentialSalesValue = 0;

        foreach ($products as $p) {
            $qty = (float)($p->opening_stock ?: 10);
            $cost = (float)($p->landed_cost > 0 ? $p->landed_cost : $p->cost_price);
            $selling = (float)$p->selling_price;
            $totalCost += $cost * $qty;
            $totalStockValue += $cost * $qty;
            $potentialSalesValue += $selling * $qty;
        }

        $potentialProfit = max(0, $potentialSalesValue - $totalStockValue);
        $averageMargin = $potentialSalesValue > 0 ? round(($potentialProfit / $potentialSalesValue) * 100, 1) : 0;

        // Breakdown by Category
        $byCategory = Category::withCount('products')->get()->map(function ($c) {
            return [
                'id' => $c->id,
                'name' => $c->name,
                'count' => $c->products_count,
            ];
        });

        // Breakdown by Brand
        $byBrand = Brand::withCount('products')->get()->map(function ($b) {
            return [
                'id' => $b->id,
                'name' => $b->name,
                'count' => $b->products_count,
            ];
        });

        // Breakdown by Product Type
        $byType = Product::select('product_type', DB::raw('count(*) as count'))
            ->groupBy('product_type')
            ->get();

        return response()->json([
            'success' => true,
            'overview' => [
                'total_products' => $totalProducts,
                'active_products' => $activeProducts,
                'inactive_products' => $inactiveProducts,
                'draft_products' => $draftProducts,
                'out_of_stock' => $outOfStock,
                'low_stock' => $lowStock,
                'expired_products' => $expiredCount,
                'expiring_soon' => $expiringSoonCount,
                'featured_products' => $featured,
                'new_products' => $newProducts,
                'discontinued_products' => $discontinued,
            ],
            'financials' => [
                'total_product_cost' => round($totalCost, 2),
                'total_stock_value' => round($totalStockValue, 2),
                'potential_sales_value' => round($potentialSalesValue, 2),
                'potential_profit' => round($potentialProfit, 2),
                'average_margin_percent' => $averageMargin,
            ],
            'by_category' => $byCategory,
            'by_brand' => $byBrand,
            'by_type' => $byType,
        ]);
    }
}