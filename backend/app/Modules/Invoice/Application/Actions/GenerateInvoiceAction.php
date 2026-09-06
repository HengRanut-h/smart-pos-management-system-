<?php

namespace App\Modules\Invoice\Application\Actions;

use App\Modules\Invoice\Domain\Contracts\InvoiceRepositoryInterface;
use App\Modules\Invoice\Persistence\Models\Invoice;
use App\Modules\Sales\Persistence\Models\Sale;

class GenerateInvoiceAction
{
    public function __construct(
        private readonly InvoiceRepositoryInterface $repository
    ) {}

    public function execute(int $saleId, int $userId): Invoice
    {
        $sale = Sale::with(['items.product'])->findOrFail($saleId);
        return $this->repository->generateFromSale($sale, $userId);
    }
}
