<?php

namespace App\Modules\Sales\Domain\Events;

use App\Modules\Sales\Persistence\Models\Sale;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SaleCompletedEvent
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Sale $sale
    ) {}
}
