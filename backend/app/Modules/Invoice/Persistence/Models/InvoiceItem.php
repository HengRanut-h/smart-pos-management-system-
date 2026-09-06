<?php

namespace App\Modules\Invoice\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Product\Persistence\Models\Product;

class InvoiceItem extends Model
{
    public $timestamps = false;
    protected $table = 'invoice_items';
    protected $guarded = ['id'];

    protected $casts = [
        'quantity' => 'decimal:4',
        'unit_price' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'discount_amount' => 'decimal:4',
        'total_amount' => 'decimal:4',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
