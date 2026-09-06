<?php

namespace App\Modules\Sales\Application\DTOs;

readonly class CompleteSaleDTO
{
    public function __construct(
        public int $branchId,
        public int $warehouseId,
        public int $cashierId,
        public ?int $customerId,
        public array $items,
        public array $payment,
        public ?string $notes = null,
        public float $pointsRedeemed = 0.0,
        public ?string $couponCode = null
    ) {}
}
