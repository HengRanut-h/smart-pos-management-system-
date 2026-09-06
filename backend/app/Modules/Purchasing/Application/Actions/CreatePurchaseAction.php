<?php

namespace App\Modules\Purchasing\Application\Actions;

use App\Modules\Purchasing\Domain\Contracts\PurchaseRepositoryInterface;
use App\Modules\Purchasing\Application\DTOs\CreatePurchaseDTO;
use App\Modules\Purchasing\Persistence\Models\Purchase;
use App\Modules\Settings\Persistence\Models\SysStatus;

class CreatePurchaseAction
{
    public function __construct(
        private readonly PurchaseRepositoryInterface $repository
    ) {}

    public function execute(CreatePurchaseDTO $dto): Purchase
    {
        $subtotal = 0.0;
        $taxAmount = 0.0;
        $discountAmount = 0.0;
        $processedItems = [];

        foreach ($dto->items as $item) {
            $lineSubtotal = (float) $item['quantity'] * (float) $item['unit_cost'];
            $lineTax = (float) ($item['tax_amount'] ?? 0);
            $lineDiscount = (float) ($item['discount_amount'] ?? 0);

            $subtotal += $lineSubtotal;
            $taxAmount += $lineTax;
            $discountAmount += $lineDiscount;

            $processedItems[] = [
                'product_id' => $item['product_id'],
                'unit_id' => $item['unit_id'],
                'quantity' => $item['quantity'],
                'received_quantity' => 0,
                'unit_cost' => $item['unit_cost'],
                'discount_amount' => $lineDiscount,
                'tax_amount' => $lineTax,
                'subtotal' => $lineSubtotal,
                'total_amount' => $lineSubtotal - $lineDiscount + $lineTax,
                'notes' => $item['notes'] ?? null,
            ];
        }

        $totalAmount = $subtotal - $discountAmount + $taxAmount;
        $statusPending = SysStatus::where('domain', 'PURCHASE')->where('code', 'PENDING_APPROVAL')->value('id') ?? 1;

        $purchaseData = [
            'purchase_number' => 'PO-' . strtoupper(uniqid()),
            'supplier_id' => $dto->supplierId,
            'branch_id' => $dto->branchId,
            'warehouse_id' => $dto->warehouseId,
            'purchase_date' => $dto->purchaseDate ?? now(),
            'expected_date' => $dto->expectedDate,
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'shipping_amount' => 0,
            'total_amount' => $totalAmount,
            'paid_amount' => 0,
            'balance_amount' => $totalAmount,
            'status_id' => $statusPending,
            'created_by' => $dto->createdBy,
            'notes' => $dto->notes,
        ];

        return $this->repository->createWithItems($purchaseData, $processedItems);
    }
}
