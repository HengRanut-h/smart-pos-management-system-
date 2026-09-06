<?php

namespace App\Modules\Customer\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Customer\Persistence\Models\Customer;
use App\Modules\Settings\Persistence\Models\SysStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $customers = Customer::latest()->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $customers,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
        ]);

        $statusActive = SysStatus::where('domain', 'SYSTEM')->where('code', 'ACTIVE')->value('id') ?? 1;

        $customer = Customer::create([
            'customer_code' => 'CUST-' . strtoupper(uniqid()),
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'] ?? null,
            'loyalty_points' => 0,
            'status_id' => $statusActive,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Customer created successfully',
            'data' => $customer,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $customer = Customer::find($id);
        if (! $customer) {
            return response()->json(['success' => false, 'message' => 'Customer not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $customer]);
    }
}
