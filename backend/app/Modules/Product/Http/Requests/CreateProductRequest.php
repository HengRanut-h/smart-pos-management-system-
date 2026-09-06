<?php

namespace App\Modules\Product\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Modules\Product\Application\DTOs\CreateProductDTO;

class CreateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sku' => ['required', 'string', 'max:100', 'unique:products,sku'],
            'barcode' => ['nullable', 'string', 'max:100', 'unique:products,barcode'],
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'tax_rate' => ['nullable', 'numeric', 'min:0'],
            'reorder_level' => ['nullable', 'numeric', 'min:0'],
            'status_id' => ['nullable', 'integer', 'exists:sys_statuses,id'],
            'image_url' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'initial_stock' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function toDTO(): CreateProductDTO
    {
        return new CreateProductDTO(
            sku: $this->validated('sku'),
            name: $this->validated('name'),
            unitId: (int) ($this->input('unit_id') ?? 3),
            costPrice: (float) $this->validated('cost_price'),
            sellingPrice: (float) $this->validated('selling_price'),
            statusId: (int) ($this->input('status_id') ?? 1),
            barcode: $this->validated('barcode'),
            categoryId: $this->filled('category_id') ? (int) $this->validated('category_id') : null,
            brandId: $this->filled('brand_id') ? (int) $this->validated('brand_id') : null,
            taxRate: $this->filled('tax_rate') ? (float) $this->validated('tax_rate') : null,
            reorderLevel: $this->filled('reorder_level') ? (float) $this->validated('reorder_level') : 10,
            imageUrl: $this->input('image_url'),
            description: $this->input('description'),
        );
    }
}
