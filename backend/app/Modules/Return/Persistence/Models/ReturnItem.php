<?php

namespace App\Modules\Return\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Sales\Persistence\Models\SaleItem;
use App\Modules\Product\Persistence\Models\Product;

class ReturnItem extends Model
{
    public $timestamps = false;
    protected $table = 'return_items';
    protected $guarded = ['id'];

    protected $casts = [
        'quantity' => 'decimal:4',
        'unit_price' => 'decimal:4',
        'refund_amount' => 'decimal:4',
        'restockable' => 'boolean',
    ];

    public function return()
    {
        return $this->belongsTo(ReturnModel::class, 'return_id');
    }

    public function saleItem()
    {
        return $this->belongsTo(SaleItem::class, 'sale_item_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
