<?php

namespace App\Modules\Sales\Domain\Contracts;

use App\Modules\Sales\Persistence\Models\Sale;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface SaleRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;
    public function findById(int $id): ?Sale;
    public function createWithItems(array $saleData, array $itemsData, array $paymentData): Sale;
}
