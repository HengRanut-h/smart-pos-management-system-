<?php

namespace App\Modules\Product\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Product\Persistence\Models\ProductQcInspection;
use App\Modules\Product\Persistence\Models\ProductReview;

class ProductQualityController extends Controller
{
    public function getQcInspections(Request $request): JsonResponse
    {
        $query = ProductQcInspection::with(['product', 'batch']);

        if ($request->filled('status') && $request->status !== 'ALL') {
            $query->where('status', $request->status);
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('id', 'desc')->get(),
        ]);
    }

    public function storeQcInspection(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'batch_id' => 'nullable|exists:product_batches,id',
            'inspection_date' => 'required|date',
            'inspector_name' => 'required|string',
            'sample_size' => 'required|integer|min:1',
            'passed_quantity' => 'required|integer|min:0',
            'failed_quantity' => 'required|integer|min:0',
            'defect_type' => 'nullable|string',
            'status' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $qc = ProductQcInspection::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'QC Inspection logged successfully',
            'data' => $qc->load(['product', 'batch']),
        ], 201);
    }

    public function getReviews(Request $request): JsonResponse
    {
        $query = ProductReview::with(['product', 'customer']);

        if ($request->filled('status') && $request->status !== 'ALL') {
            $query->where('status', $request->status);
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('id', 'desc')->get(),
        ]);
    }

    public function updateReviewStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:APPROVED,REJECTED,PENDING',
        ]);

        $rev = ProductReview::findOrFail($id);
        $rev->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Review status updated to ' . $validated['status'],
            'data' => $rev,
        ]);
    }
}