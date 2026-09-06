<?php

namespace App\Modules\Payment\Domain\Events;

use App\Modules\Payment\Persistence\Models\Payment;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentCompletedEvent
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Payment $payment
    ) {}
}
