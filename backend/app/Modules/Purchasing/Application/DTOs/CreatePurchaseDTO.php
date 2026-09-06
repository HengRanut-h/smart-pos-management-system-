<?php

namespace App\Modules\Purchasing\Application\DTOs;

readonly class CreatePurchaseDTO
{
    public function __construct(
        public int $supplierId,
        public int $branchId,
        public int $warehouseId,
        public int $createdBy,
        public array $items,
        public ?string $purchaseDate = null,
        public ?string $expectedDate = null,
        public ?string $notes = null
    ) {}
}
