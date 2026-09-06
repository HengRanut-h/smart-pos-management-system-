<?php

namespace App\Modules\Return\Domain\Contracts;

use App\Modules\Return\Persistence\Models\ReturnModel;
use App\Modules\Sales\Persistence\Models\Sale;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ReturnRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;
    public function processReturn(array $returnData, array $itemsData, int $userId): ReturnModel;
    public function voidSale(int $saleId, string $reason, int $userId): Sale;
}
