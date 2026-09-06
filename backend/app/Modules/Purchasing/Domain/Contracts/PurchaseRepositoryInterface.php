<?php

namespace App\Modules\Purchasing\Domain\Contracts;

use App\Modules\Purchasing\Persistence\Models\Purchase;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface PurchaseRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;
    public function findById(int $id): ?Purchase;
    public function createWithItems(array $purchaseData, array $itemsData): Purchase;
    public function approve(int $id, int $userId): Purchase;
    public function receiveGoods(int $id, array $receivedItems, int $userId): Purchase;
}
