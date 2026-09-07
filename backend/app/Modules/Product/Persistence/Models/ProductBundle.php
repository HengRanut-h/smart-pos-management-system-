<?php

namespace App\Modules\Product\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductBundle extends Model
{
    protected $table = 'product_bundles';

    protected $fillable = [
        'bundle_product_id',
        'component_product_id',
        'quantity',
        'unit_price_override',
    ];

    protected $casts = [
        'quantity' => 'float',
        'unit_price_override' => 'float',
    ];

    public function bundleProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'bundle_product_id');
    }

    public function componentProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'component_product_id');
    }
}