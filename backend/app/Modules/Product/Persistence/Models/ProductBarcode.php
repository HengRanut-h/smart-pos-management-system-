<?php

namespace App\Modules\Product\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductBarcode extends Model
{
    protected $table = 'product_barcodes';

    protected $fillable = [
        'product_id',
        'barcode',
        'barcode_type',
        'package_type',
        'multiplier',
        'custom_price',
        'is_primary',
        'notes',
    ];

    protected $casts = [
        'multiplier' => 'integer',
        'custom_price' => 'float',
        'is_primary' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
