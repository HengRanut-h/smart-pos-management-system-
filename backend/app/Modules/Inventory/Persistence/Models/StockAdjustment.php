<?php

namespace App\Modules\Inventory\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Warehouse\Persistence\Models\Warehouse;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\User\Persistence\Models\User;

class StockAdjustment extends Model
{
    protected $table = 'stock_adjustments';
    protected $guarded = ['id'];

    protected $casts = [
        'quantity' => 'decimal:4',
        'before_quantity' => 'decimal:4',
        'after_quantity' => 'decimal:4',
    ];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
