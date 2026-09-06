<?php

namespace App\Modules\Audit\Application\Subscribers;

use App\Modules\Audit\Persistence\Models\AuditLog;
use App\Modules\Sales\Domain\Events\SaleCompletedEvent;
use App\Modules\Payment\Domain\Events\PaymentCompletedEvent;
use Illuminate\Events\Dispatcher;

class AuditSubscriber
{
    public function handleSaleCompleted(SaleCompletedEvent $event): void
    {
        AuditLog::create([
            'user_id' => $event->sale->cashier_id,
            'action' => 'CREATE',
            'entity_type' => 'Sale',
            'entity_id' => $event->sale->id,
            'old_values' => null,
            'new_values' => [
                'sale_number' => $event->sale->sale_number,
                'total_amount' => $event->sale->total_amount,
                'paid_amount' => $event->sale->paid_amount,
            ],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'request_id' => request()->header('X-Request-ID') ?? uniqid(),
            'created_at' => now(),
        ]);
    }

    public function handlePaymentCompleted(PaymentCompletedEvent $event): void
    {
        AuditLog::create([
            'user_id' => $event->payment->created_by,
            'action' => 'PAYMENT',
            'entity_type' => 'Payment',
            'entity_id' => $event->payment->id,
            'old_values' => null,
            'new_values' => [
                'payment_number' => $event->payment->payment_number,
                'amount' => $event->payment->amount,
                'currency' => $event->payment->currency,
                'transaction_id' => $event->payment->transaction_id,
            ],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'request_id' => request()->header('X-Request-ID') ?? uniqid(),
            'created_at' => now(),
        ]);
    }

    public function subscribe(Dispatcher $events): array
    {
        return [
            SaleCompletedEvent::class => 'handleSaleCompleted',
            PaymentCompletedEvent::class => 'handlePaymentCompleted',
        ];
    }
}
