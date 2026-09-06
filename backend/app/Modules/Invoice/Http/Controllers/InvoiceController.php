<?php

namespace App\Modules\Invoice\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Invoice\Domain\Contracts\InvoiceRepositoryInterface;
use App\Modules\Invoice\Application\Actions\GenerateInvoiceAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function __construct(
        private readonly InvoiceRepositoryInterface $repository
    ) {}

    public function index(Request $request): JsonResponse
    {
        $invoices = $this->repository->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $invoices,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $invoice = $this->repository->findById($id);
        if (! $invoice) {
            return response()->json(['success' => false, 'message' => 'Invoice not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $invoice]);
    }

    public function generateFromSale(int $saleId, Request $request, GenerateInvoiceAction $action): JsonResponse
    {
        $invoice = $action->execute($saleId, $request->user()?->id ?? 1);

        return response()->json([
            'success' => true,
            'message' => 'Invoice generated successfully',
            'data' => $invoice,
        ], 201);
    }
}
