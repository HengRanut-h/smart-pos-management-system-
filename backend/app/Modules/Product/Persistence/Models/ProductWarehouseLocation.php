<?php

namespace App\Modules\Product\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\Warehouse\Persistence\Models\Warehouse;

class ProductWarehouseLocation extends Model
{
    protected $table = 'product_warehouse_locations';

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'zone',
        'rack',
        'shelf',
        'bin',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'float',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }
}