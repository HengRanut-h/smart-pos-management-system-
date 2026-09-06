<?php

namespace App\Modules\Payment\Infrastructure\Payment;

use App\Modules\Payment\Domain\Contracts\PaymentGatewayInterface;

class KHQRPaymentGateway implements PaymentGatewayInterface
{
    /**
     * Generate Bakong KHQR String and MD5/CRC Hash
     */
    public function generateQR(string $billNumber, float $amount, string $currency = 'USD'): array
    {
        // Standard KHQR EMVCo format payload simulation
        $qrString = sprintf("00020101021229%s5303%s54%02.2f5802KH5908SMARTPOS6010PHNOM PENH62%s6304",
            strtoupper($billNumber),
            $currency === 'USD' ? '840' : '116',
            $amount,
            $billNumber
        );

        $md5 = md5($qrString . config('app.key'));

        return [
            'qr_string' => $qrString,
            'md5' => $md5,
            'bill_number' => $billNumber,
            'amount' => $amount,
            'currency' => $currency,
        ];
    }

    /**
     * Verify payment status with Bakong / Provider API
     */
    public function verifyTransaction(string $transactionId): array
    {
        // In live system, make HTTPS request to Bakong Open API.
        // For development/mocking, simulate successful verification.
        return [
            'status' => 'SUCCESS',
            'transaction_id' => $transactionId,
            'acknowledged_at' => now()->toIso8601String(),
        ];
    }
}
