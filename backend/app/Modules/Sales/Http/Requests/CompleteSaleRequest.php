<?php

namespace App\Modules\Sales\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Modules\Sales\Application\DTOs\CompleteSaleDTO;

class CompleteSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'points_redeemed' => ['nullable', 'numeric', 'min:0'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.unit_id' => ['required', 'integer', 'exists:units,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.0001'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_amount' => ['nullable', 'numeric', 'min:0'],
            'payment' => ['required', 'array'],
            'payment.payment_method_id' => ['required', 'integer', 'exists:payment_methods,id'],
            'payment.amount' => ['required', 'numeric', 'min:0'],
            'payment.currency' => ['nullable', 'string', 'size:3'],
            'payment.reference_number' => ['nullable', 'string', 'max:150'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function toDTO(): CompleteSaleDTO
    {
        return new CompleteSaleDTO(
            branchId: (int) $this->validated('branch_id'),
            warehouseId: (int) $this->validated('warehouse_id'),
            cashierId: (int) ($this->user()?->id ?? 1),
            customerId: $this->filled('customer_id') ? (int) $this->validated('customer_id') : null,
            items: $this->validated('items'),
            payment: $this->validated('payment'),
            notes: $this->validated('notes'),
            pointsRedeemed: (float) ($this->validated('points_redeemed') ?? 0.0),
            couponCode: $this->filled('coupon_code') ? strtoupper(trim($this->validated('coupon_code'))) : null
        );
    }
}
