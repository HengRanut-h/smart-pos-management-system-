<?php

namespace App\Modules\Product\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'name' => $this->name,
            'description' => $this->description,
            'image_url' => $this->image_url,
            'category' => $this->whenLoaded('category'),
            'brand' => $this->whenLoaded('brand'),
            'unit' => $this->whenLoaded('unit'),
            'cost_price' => $this->cost_price,
            'selling_price' => $this->selling_price,
            'tax_rate' => $this->tax_rate,
            'reorder_level' => $this->reorder_level,
            'available_quantity' => $this->relationLoaded('stocks') ? (float) $this->stocks->sum('quantity') : 0.0,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
