<?php

namespace App\Modules\Sales\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sale_number' => $this->sale_number,
            'branch' => $this->whenLoaded('branch'),
            'customer' => $this->whenLoaded('customer'),
            'cashier' => $this->whenLoaded('cashier'),
            'subtotal' => $this->subtotal,
            'discount_amount' => $this->discount_amount,
            'tax_amount' => $this->tax_amount,
            'total_amount' => $this->total_amount,
            'paid_amount' => $this->paid_amount,
            'change_amount' => $this->change_amount,
            'sale_date' => $this->sale_date?->toIso8601String(),
            'items' => $this->whenLoaded('items'),
            'payments' => $this->whenLoaded('payments'),
        ];
    }
}
