<?php

namespace App\Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\Product\Persistence\Models\ProductWarehouseLocation;
use App\Modules\Product\Persistence\Models\ProductBatch;
use App\Modules\Product\Persistence\Models\ProductSerialNumber;
use App\Modules\Product\Persistence\Models\ProductWarranty;
use App\Modules\Product\Persistence\Models\UnitConversion;
use Carbon\Carbon;

class ProductInventoryController extends Controller
{
    public function getWarehouseLocations(Request $request): JsonResponse
    {
        $query = ProductWarehouseLocation::with(['product', 'warehouse']);

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function storeWarehouseLocation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'zone' => 'nullable|string',
            'rack' => 'nullable|string',
            'shelf' => 'nullable|string',
            'bin' => 'nullable|string',
            'quantity' => 'nullable|numeric|min:0',
        ]);

        $loc = ProductWarehouseLocation::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Warehouse bin location registered',
            'data' => $loc->load(['product', 'warehouse']),
        ], 201);
    }

    public function getBatches(Request $request): JsonResponse
    {
        $query = ProductBatch::with(['product', 'supplier', 'warehouse']);

        if ($request->filled('status') && $request->status !== 'ALL') {
            $query->where('status', $request->status);
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('expiry_date', 'asc')->get(),
        ]);
    }

    public function storeBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'batch_number' => 'required|string',
            'lot_number' => 'nullable|string',
            'manufacturing_date' => 'nullable|date',
            'expiry_date' => 'required|date',
            'quantity' => 'required|numeric|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'unit_cost' => 'nullable|numeric|min:0',
        ]);

        $exp = Carbon::parse($validated['expiry_date']);
        $now = Carbon::now();
        if ($exp->isPast()) {
            $validated['status'] = 'EXPIRED';
        } elseif ($exp->diffInDays($now) <= 30) {
            $validated['status'] = 'EXPIRING_SOON';
        } else {
            $validated['status'] = 'FRESH';
        }

        $batch = ProductBatch::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Batch / Lot recorded successfully',
            'data' => $batch->load(['product', 'supplier', 'warehouse']),
        ], 201);
    }

    public function getSerialNumbers(Request $request): JsonResponse
    {
        $query = ProductSerialNumber::with(['product', 'customer', 'sale']);

        if ($request->filled('status') && $request->status !== 'ALL') {
            $query->where('status', $request->status);
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('id', 'desc')->get(),
        ]);
    }

    public function storeSerialNumber(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'serial_number' => 'required|string|unique:product_serial_numbers,serial_number',
            'imei' => 'nullable|string',
            'status' => 'nullable|string',
            'warranty_expiry_date' => 'nullable|date',
        ]);

        $serial = ProductSerialNumber::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Serial number registered',
            'data' => $serial,
        ], 201);
    }

    public function getUnitConversions(): JsonResponse
    {
        $conversions = UnitConversion::with(['fromUnit', 'toUnit'])->get();
        return response()->json([
            'success' => true,
            'data' => $conversions,
        ]);
    }

    public function storeUnitConversion(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_unit_id' => 'required|exists:units,id',
            'to_unit_id' => 'required|exists:units,id|different:from_unit_id',
            'multiplier' => 'required|numeric|min:0.0001',
            'description' => 'nullable|string',
        ]);

        $conv = UnitConversion::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Unit conversion factor registered',
            'data' => $conv->load(['fromUnit', 'toUnit']),
        ], 201);
    }
}