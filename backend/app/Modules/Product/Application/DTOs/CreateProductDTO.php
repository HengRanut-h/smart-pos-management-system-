<?php

namespace App\Modules\Product\Application\DTOs;

readonly class CreateProductDTO
{
    public function __construct(
        public string $sku,
        public string $name,
        public int $unitId,
        public float $costPrice,
        public float $sellingPrice,
        public int $statusId = 1,
        public ?string $barcode = null,
        public ?int $categoryId = null,
        public ?int $brandId = null,
        public ?float $taxRate = null,
        public ?float $reorderLevel = null,
        public ?string $imageUrl = null,
        public ?string $description = null
    ) {}

    public function toArray(): array
    {
        return [
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'name' => $this->name,
            'category_id' => $this->categoryId,
            'brand_id' => $this->brandId,
            'unit_id' => $this->unitId,
            'cost_price' => $this->costPrice,
            'selling_price' => $this->sellingPrice,
            'tax_rate' => $this->taxRate,
            'reorder_level' => $this->reorderLevel,
            'status_id' => $this->statusId,
            'image_url' => $this->imageUrl,
            'description' => $this->description,
        ];
    }
}
