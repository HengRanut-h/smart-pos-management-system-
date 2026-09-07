<?php

namespace App\Modules\Product\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPriceRule extends Model
{
    protected $table = 'product_price_rules';

    protected $fillable = [
        'product_id',
        'name',
        'rule_type',
        'price_value',
        'min_quantity',
        'customer_group_id',
        'branch_id',
        'start_date',
        'end_date',
        'is_active',
    ];

    protected $casts = [
        'price_value' => 'float',
        'min_quantity' => 'integer',
        'is_active' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}