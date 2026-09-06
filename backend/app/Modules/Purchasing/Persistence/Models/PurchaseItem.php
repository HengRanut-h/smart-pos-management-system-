<?php

namespace App\Modules\Purchasing\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\Unit\Persistence\Models\Unit;

class PurchaseItem extends Model
{
    public $timestamps = false;
    protected $table = 'purchase_items';
    protected $guarded = ['id'];

    protected $casts = [
        'quantity' => 'decimal:4',
        'received_quantity' => 'decimal:4',
        'unit_cost' => 'decimal:4',
        'discount_amount' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'subtotal' => 'decimal:4',
        'total_amount' => 'decimal:4',
    ];

    public function purchase()
    {
        return $this->belongsTo(Purchase::class, 'purchase_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }
}
