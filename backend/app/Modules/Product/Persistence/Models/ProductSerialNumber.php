<?php

namespace App\Modules\Product\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\Customer\Persistence\Models\Customer;
use App\Modules\Sales\Persistence\Models\Sale;

class ProductSerialNumber extends Model
{
    protected $table = 'product_serial_numbers';

    protected $fillable = [
        'product_id',
        'serial_number',
        'imei',
        'status',
        'customer_id',
        'sale_id',
        'warranty_expiry_date',
    ];

    protected $casts = [
        'warranty_expiry_date' => 'date',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }
}