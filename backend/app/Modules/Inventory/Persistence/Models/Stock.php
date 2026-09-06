<?php

namespace App\Modules\Inventory\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Warehouse\Persistence\Models\Warehouse;
use App\Modules\Product\Persistence\Models\Product;

class Stock extends Model
{
    protected $table = 'stocks';
    protected $guarded = ['id'];

    protected $casts = [
        'quantity' => 'decimal:4',
        'reserved_quantity' => 'decimal:4',
        'available_quantity' => 'decimal:4',
        'reorder_level' => 'decimal:4',
        'last_counted_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::saving(function ($stock) {
            if ($stock->available_quantity === null) {
                $stock->available_quantity = max(0.0, (float)($stock->quantity ?? 0) - (float)($stock->reserved_quantity ?? 0));
            }
        });
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
