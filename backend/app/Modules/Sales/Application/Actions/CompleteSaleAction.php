<?php

namespace App\Modules\Sales\Application\Actions;

use App\Modules\Sales\Domain\Contracts\SaleRepositoryInterface;
use App\Modules\Sales\Domain\Rules\CheckSufficientStockRule;
use App\Modules\Sales\Domain\Events\SaleCompletedEvent;
use App\Modules\Sales\Application\DTOs\CompleteSaleDTO;
use App\Modules\Sales\Persistence\Models\Sale;
use App\Modules\Customer\Persistence\Models\Customer;
use App\Modules\Discount\Persistence\Models\Coupon;
use App\Modules\Discount\Persistence\Models\CouponUsage;
use App\Modules\Settings\Persistence\Models\SysStatus;

class CompleteSaleAction
{
    public function __construct(
        private readonly SaleRepositoryInterface $repository
    ) {}

    public function execute(CompleteSaleDTO $dto): Sale
    {
        // 1. Business Rule Enforcement: Verify stock for all items
        foreach ($dto->items as $item) {
            CheckSufficientStockRule::check(
                $dto->warehouseId,
                $item['product_id'],
                $item['quantity']
            );
        }

        // Calculate Totals authoritative on backend
        $subtotal = 0.0;
        $taxAmount = 0.0;
        $discountAmount = 0.0;
        $processedItems = [];

        foreach ($dto->items as $item) {
            $itemSubtotal = $item['quantity'] * $item['unit_price'];
            $itemTax = $item['tax_amount'] ?? 0.0;
            $itemDiscount = $item['discount_amount'] ?? 0.0;

            $subtotal += $itemSubtotal;
            $taxAmount += $itemTax;
            $discountAmount += $itemDiscount;

            $processedItems[] = [
                'product_id' => $item['product_id'],
                'unit_id' => $item['unit_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'discount_amount' => $itemDiscount,
                'tax_rate' => $item['tax_rate'] ?? 0,
                'tax_amount' => $itemTax,
                'subtotal' => $itemSubtotal,
                'total_amount' => $itemSubtotal - $itemDiscount + $itemTax,
                'returned_quantity' => 0,
                'notes' => $item['notes'] ?? null,
            ];
        }

        // Apply loyalty points discount: 100 points = $1.00 USD
        $pointsDiscount = $dto->pointsRedeemed > 0 ? round($dto->pointsRedeemed / 100, 4) : 0.0;

        // Apply coupon discount if provided
        $couponDiscount = 0.0;
        $appliedCoupon = null;
        if ($dto->couponCode) {
            $coupon = Coupon::with('discount')->where('code', $dto->couponCode)->first();
            if ($coupon) {
                $validation = $coupon->isValidForAmount($subtotal);
                if ($validation['valid']) {
                    $couponDiscount = (float) $validation['discount_amount'];
                    $appliedCoupon = $coupon;
                }
            }
        }

        $totalDiscount = $discountAmount + $pointsDiscount + $couponDiscount;
        $totalAmount = max(0.0, $subtotal - $totalDiscount + $taxAmount);
        $paidAmount = $dto->payment['amount'] ?? $totalAmount;
        $changeAmount = max(0.0, $paidAmount - $totalAmount);

        $statusCompleted = SysStatus::where('domain', 'SALE')->where('code', 'COMPLETED')->value('id') ?? 1;
        $paymentStatusPaid = SysStatus::where('domain', 'PAYMENT')->where('code', 'PAID')->value('id') ?? 1;

        $saleData = [
            'sale_number' => 'SALE-' . strtoupper(uniqid()),
            'branch_id' => $dto->branchId,
            'warehouse_id' => $dto->warehouseId,
            'customer_id' => $dto->customerId,
            'cashier_id' => $dto->cashierId,
            'sale_date' => now(),
            'subtotal' => $subtotal,
            'discount_amount' => $totalDiscount,
            'tax_amount' => $taxAmount,
            'shipping_amount' => 0,
            'total_amount' => $totalAmount,
            'paid_amount' => $paidAmount,
            'change_amount' => $changeAmount,
            'status_id' => $statusCompleted,
            'payment_status_id' => $paymentStatusPaid,
            'notes' => $dto->notes,
        ];

        $paymentData = [
            'payment_number' => 'PAY-' . strtoupper(uniqid()),
            'customer_id' => $dto->customerId,
            'payment_method_id' => $dto->payment['payment_method_id'],
            'amount' => $paidAmount,
            'currency' => $dto->payment['currency'] ?? 'USD',
            'exchange_rate' => $dto->payment['exchange_rate'] ?? 1.0,
            'reference_number' => $dto->payment['reference_number'] ?? null,
            'transaction_id' => $dto->payment['transaction_id'] ?? null,
            'status_id' => $paymentStatusPaid,
        ];

        // 2. Execute Transaction in Repository
        $sale = $this->repository->createWithItems($saleData, $processedItems, $paymentData);

        // 3. Record Coupon Usage if coupon applied
        if ($appliedCoupon) {
            $appliedCoupon->increment('usage_count');
            CouponUsage::create([
                'coupon_id' => $appliedCoupon->id,
                'customer_id' => $dto->customerId,
                'sale_id' => $sale->id,
                'used_at' => now(),
            ]);
        }

        // 4. Customer Loyalty Points Calculation
        if ($dto->customerId) {
            $customer = Customer::find($dto->customerId);
            if ($customer) {
                // Earn 1 point per $1 spent
                $earnedPoints = floor($totalAmount);
                $redeemed = $dto->pointsRedeemed;
                $newPoints = max(0.0, (float)$customer->loyalty_points - $redeemed + $earnedPoints);
                $customer->update(['loyalty_points' => $newPoints]);
                
                // Attach customer details to response
                $sale->setRelation('customer', $customer);
            }
        }

        // 5. Dispatch Domain Event
        SaleCompletedEvent::dispatch($sale);

        return $sale;
    }
}
