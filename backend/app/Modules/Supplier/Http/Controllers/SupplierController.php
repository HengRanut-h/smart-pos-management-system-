<?php

namespace App\Modules\Supplier\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Supplier\Persistence\Models\Supplier;
use App\Modules\Settings\Persistence\Models\SysStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $suppliers = Supplier::latest()->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $suppliers,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'tax_number' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
        ]);

        $statusActive = SysStatus::where('domain', 'SYSTEM')->where('code', 'ACTIVE')->value('id') ?? 1;

        $supplier = Supplier::create([
            'code' => 'SUP-' . strtoupper(uniqid()),
            'name' => $validated['name'],
            'contact_person' => $validated['contact_person'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'tax_number' => $validated['tax_number'] ?? null,
            'address' => $validated['address'] ?? null,
            'status_id' => $statusActive,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Supplier created successfully',
            'data' => $supplier,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $supplier = Supplier::find($id);
        if (! $supplier) {
            return response()->json(['success' => false, 'message' => 'Supplier not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $supplier]);
    }
}
