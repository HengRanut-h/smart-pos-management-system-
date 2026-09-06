<?php

namespace App\Modules\Payment\Application\Actions;

use App\Modules\Payment\Domain\Contracts\PaymentGatewayInterface;
use App\Modules\Payment\Domain\Exceptions\PaymentVerificationException;
use App\Modules\Payment\Domain\Events\PaymentCompletedEvent;
use App\Modules\Payment\Persistence\Models\Payment;
use App\Modules\Settings\Persistence\Models\SysStatus;
use Illuminate\Support\Facades\DB;

class VerifyPaymentAction
{
    public function __construct(
        private readonly PaymentGatewayInterface $gateway
    ) {}

    public function execute(int $paymentId, ?string $externalTxnId = null): Payment
    {
        return DB::transaction(function () use ($paymentId, $externalTxnId) {
            $payment = Payment::with('sale')->lockForUpdate()->findOrFail($paymentId);

            $statusPaid = SysStatus::where('domain', 'PAYMENT')->where('code', 'PAID')->value('id') ?? 1;

            // Idempotency: If already paid, return without duplicate operations
            if ($payment->status_id == $statusPaid) {
                return $payment;
            }

            $txnId = $externalTxnId ?? $payment->transaction_id ?? 'TXN-' . uniqid();
            $verification = $this->gateway->verifyTransaction($txnId);

            if (($verification['status'] ?? '') !== 'SUCCESS') {
                throw new PaymentVerificationException("Payment verification failed for transaction {$txnId}");
            }

            $payment->transaction_id = $txnId;
            $payment->status_id = $statusPaid;
            $payment->save();

            // Update associated Sale payment status if attached
            if ($payment->sale) {
                $statusSalePaid = SysStatus::where('domain', 'PAYMENT')->where('code', 'PAID')->value('id') ?? 1;
                $payment->sale->payment_status_id = $statusSalePaid;
                $payment->sale->save();
            }

            PaymentCompletedEvent::dispatch($payment);

            return $payment;
        });
    }
}
