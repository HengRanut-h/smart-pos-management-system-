<?php

namespace App\Modules\Discount\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Customer\Persistence\Models\Customer;
use App\Modules\Sales\Persistence\Models\Sale;

class CouponUsage extends Model
{
    public $timestamps = false;
    protected $table = 'coupon_usages';

    protected $fillable = [
        'coupon_id',
        'customer_id',
        'sale_id',
        'used_at',
    ];

    protected $casts = [
        'used_at' => 'datetime',
    ];

    public function coupon()
    {
        return $this->belongsTo(Coupon::class, 'coupon_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }
}
