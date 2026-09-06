<?php

namespace App\Modules\Inventory\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\Warehouse\Persistence\Models\Warehouse;
use App\Modules\User\Persistence\Models\User;

class StockMovement extends Model
{
    public $timestamps = false;
    protected $table = 'stock_movements';
    protected $guarded = ['id'];

    protected $casts = [
        'quantity' => 'decimal:4',
        'before_quantity' => 'decimal:4',
        'after_quantity' => 'decimal:4',
        'unit_cost' => 'decimal:4',
        'created_at' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
