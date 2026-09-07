<?php

namespace App\Modules\Product\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\Supplier\Persistence\Models\Supplier;

class ProductSupplier extends Model
{
    protected $table = 'product_suppliers';

    protected $fillable = [
        'product_id',
        'supplier_id',
        'supplier_sku',
        'supplier_price',
        'minimum_order_qty',
        'lead_time_days',
        'is_preferred',
        'supplier_barcode',
    ];

    protected $casts = [
        'supplier_price' => 'float',
        'minimum_order_qty' => 'integer',
        'lead_time_days' => 'integer',
        'is_preferred' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }
}