<?php

namespace App\Modules\Sales\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\Unit\Persistence\Models\Unit;

class SaleItem extends Model
{
    public $timestamps = false;
    protected $table = 'sale_items';
    protected $guarded = ['id'];

    protected $casts = [
        'quantity' => 'decimal:4',
        'unit_price' => 'decimal:4',
        'discount_amount' => 'decimal:4',
        'tax_rate' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'subtotal' => 'decimal:4',
        'total_amount' => 'decimal:4',
        'returned_quantity' => 'decimal:4',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
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
