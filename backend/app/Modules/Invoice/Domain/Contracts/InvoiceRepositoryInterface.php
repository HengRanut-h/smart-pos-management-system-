<?php

namespace App\Modules\Invoice\Domain\Contracts;

use App\Modules\Invoice\Persistence\Models\Invoice;
use App\Modules\Sales\Persistence\Models\Sale;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface InvoiceRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;
    public function findById(int $id): ?Invoice;
    public function generateFromSale(Sale $sale, int $userId): Invoice;
}
