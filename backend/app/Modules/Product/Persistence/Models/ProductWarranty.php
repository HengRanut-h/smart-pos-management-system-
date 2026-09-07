<?php

namespace App\Modules\Product\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\Sales\Persistence\Models\Sale;

class ProductWarranty extends Model
{
    protected $table = 'product_warranties';

    protected $fillable = [
        'product_id',
        'sale_id',
        'serial_number',
        'warranty_period_months',
        'start_date',
        'end_date',
        'warranty_type',
        'provider',
        'terms',
        'claim_status',
    ];

    protected $casts = [
        'warranty_period_months' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }
}