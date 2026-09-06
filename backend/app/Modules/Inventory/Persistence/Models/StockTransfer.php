<?php

namespace App\Modules\Inventory\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Warehouse\Persistence\Models\Warehouse;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\User\Persistence\Models\User;

class StockTransfer extends Model
{
    protected $table = 'stock_transfers';
    protected $guarded = ['id'];

    protected $casts = [
        'quantity' => 'decimal:4',
    ];

    public function fromWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    public function toWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
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
