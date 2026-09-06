<?php

namespace App\Modules\Discount\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Discount\Persistence\Models\Coupon;
use App\Modules\Discount\Persistence\Models\Discount;

class CouponController extends Controller
{
    public function index(): JsonResponse
    {
        $coupons = Coupon::with('discount')->where('end_at', '>=', now())->get();
        return response()->json(['data' => $coupons]);
    }

    public function validateCoupon(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0',
        ]);

        $code = strtoupper(trim($request->input('code')));
        $subtotal = (float)$request->input('subtotal');

        $coupon = Coupon::with('discount')->where('code', $code)->first();

        if (!$coupon) {
            return response()->json([
                'valid' => false,
                'message' => 'Coupon code does not exist.'
            ], 404);
        }

        $result = $coupon->isValidForAmount($subtotal);

        if (!$result['valid']) {
            return response()->json($result, 422);
        }

        return response()->json($result, 200);
    }
}
