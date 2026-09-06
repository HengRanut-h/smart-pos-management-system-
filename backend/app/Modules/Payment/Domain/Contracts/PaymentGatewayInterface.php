<?php

namespace App\Modules\Payment\Domain\Contracts;

interface PaymentGatewayInterface
{
    public function generateQR(string $billNumber, float $amount, string $currency = 'USD'): array;
    public function verifyTransaction(string $transactionId): array;
}
