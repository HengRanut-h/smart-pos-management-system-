<?php

namespace App\Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\Product\Persistence\Models\ProductPriceRule;
use App\Modules\Product\Persistence\Models\ProductPriceHistory;

class ProductPricingController extends Controller
{
    public function getPriceRules(): JsonResponse
    {
        $rules = ProductPriceRule::with('product')->orderBy('id', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $rules,
        ]);
    }

    public function storePriceRule(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'rule_type' => 'required|string',
            'price_value' => 'required|numeric',
            'product_id' => 'nullable|exists:products,id',
            'min_quantity' => 'nullable|integer',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $rule = ProductPriceRule::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Price rule created successfully',
            'data' => $rule,
        ], 201);
    }

    public function calculateLandedCost(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'purchase_cost' => 'required|numeric|min:0',
            'shipping_cost' => 'nullable|numeric|min:0',
            'import_tax' => 'nullable|numeric|min:0',
            'handling_cost' => 'nullable|numeric|min:0',
            'other_expenses' => 'nullable|numeric|min:0',
            'target_margin_percent' => 'nullable|numeric|min:0|max:100',
        ]);

        $base = (float)$validated['purchase_cost'];
        $shipping = (float)($validated['shipping_cost'] ?? 0);
        $tax = (float)($validated['import_tax'] ?? 0);
        $handling = (float)($validated['handling_cost'] ?? 0);
        $other = (float)($validated['other_expenses'] ?? 0);

        $landedCost = $base + $shipping + $tax + $handling + $other;
        $marginPercent = (float)($validated['target_margin_percent'] ?? 25);

        $recommendedSellingPrice = $marginPercent < 100 
            ? round($landedCost / (1 - ($marginPercent / 100)), 2)
            : round($landedCost * 1.3, 2);

        $projectedProfit = round($recommendedSellingPrice - $landedCost, 2);

        return response()->json([
            'success' => true,
            'breakdown' => [
                'purchase_cost' => $base,
                'shipping_cost' => $shipping,
                'import_tax' => $tax,
                'handling_cost' => $handling,
                'other_expenses' => $other,
                'total_landed_cost' => round($landedCost, 2),
                'target_margin_percent' => $marginPercent,
                'recommended_selling_price' => $recommendedSellingPrice,
                'projected_unit_profit' => $projectedProfit,
            ],
        ]);
    }
}