<?php

namespace App\Modules\Delivery\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Delivery\Persistence\Models\CustomerDeliveryAddress;

class CustomerAddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CustomerDeliveryAddress::with('customer');

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        $addresses = $query->orderBy('is_default', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $addresses,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'label' => 'required|string',
            'recipient_name' => 'required|string',
            'recipient_phone' => 'required|string',
            'province' => 'nullable|string',
            'district' => 'nullable|string',
            'commune' => 'nullable|string',
            'village' => 'nullable|string',
            'street' => 'nullable|string',
            'house_number' => 'nullable|string',
            'full_address' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'landmark' => 'nullable|string',
            'delivery_instructions' => 'nullable|string',
            'is_default' => 'nullable|boolean',
        ]);

        if (!empty($data['is_default']) && $data['is_default']) {
            CustomerDeliveryAddress::where('customer_id', $data['customer_id'])->update(['is_default' => false]);
        }

        $address = CustomerDeliveryAddress::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Delivery address saved',
            'data' => $address,
        ], 201);
    }
}
