<?php

namespace App\Modules\Delivery\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Delivery\Persistence\Models\DeliveryRating;
use App\Modules\Delivery\Persistence\Models\DeliveryDriver;

class DeliveryRatingController extends Controller
{
    public function index(): JsonResponse
    {
        $ratings = DeliveryRating::with(['delivery', 'customer', 'driver'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $ratings,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'delivery_id' => 'required|exists:deliveries,id',
            'customer_id' => 'nullable|exists:customers,id',
            'driver_id' => 'nullable|exists:delivery_drivers,id',
            'overall_rating' => 'required|numeric|min:1|max:5',
            'driver_rating' => 'nullable|numeric|min:1|max:5',
            'speed_rating' => 'nullable|numeric|min:1|max:5',
            'communication_rating' => 'nullable|numeric|min:1|max:5',
            'package_rating' => 'nullable|numeric|min:1|max:5',
            'review_text' => 'nullable|string',
        ]);

        $rating = DeliveryRating::create($data);

        // recalculate driver average rating
        if (!empty($data['driver_id'])) {
            $avg = DeliveryRating::where('driver_id', $data['driver_id'])->avg('driver_rating');
            DeliveryDriver::where('id', $data['driver_id'])->update(['rating' => round($avg, 2)]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Thank you! Rating saved.',
            'data' => $rating,
        ], 201);
    }
}
