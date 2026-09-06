<?php

namespace App\Modules\Payment\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Payment\Domain\Contracts\PaymentGatewayInterface;
use App\Modules\Payment\Application\Actions\VerifyPaymentAction;
use App\Modules\Payment\Persistence\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payments = Payment::with(['sale', 'method', 'creator'])->latest()->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $payment = Payment::with(['sale', 'method', 'creator'])->find($id);
        if (! $payment) {
            return response()->json(['success' => false, 'message' => 'Payment not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $payment]);
    }

    public function generateKHQR(Request $request, PaymentGatewayInterface $gateway): JsonResponse
    {
        $validated = $request->validate([
            'bill_number' => ['required', 'string', 'max:50'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['nullable', 'string', 'in:USD,KHR'],
        ]);

        $qrData = $gateway->generateQR(
            $validated['bill_number'],
            (float) $validated['amount'],
            $validated['currency'] ?? 'USD'
        );

        return response()->json([
            'success' => true,
            'data' => $qrData,
        ]);
    }

    public function verify(int $id, Request $request, VerifyPaymentAction $action): JsonResponse
    {
        $payment = $action->execute($id, $request->input('transaction_id'));

        return response()->json([
            'success' => true,
            'message' => 'Payment verified successfully',
            'data' => $payment,
        ]);
    }
}
