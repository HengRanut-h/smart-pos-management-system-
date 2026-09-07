<?php

namespace App\Modules\Product\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariant extends Model
{
    use SoftDeletes;

    protected $table = 'product_variants';

    protected $fillable = [
        'product_id',
        'sku',
        'barcode',
        'variant_name',
        'attribute_values',
        'cost_price',
        'selling_price',
        'wholesale_price',
        'weight',
        'dimensions',
        'stock_quantity',
        'image_url',
        'is_active',
    ];

    protected $casts = [
        'attribute_values' => 'array',
        'cost_price' => 'float',
        'selling_price' => 'float',
        'wholesale_price' => 'float',
        'weight' => 'float',
        'stock_quantity' => 'float',
        'is_active' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}