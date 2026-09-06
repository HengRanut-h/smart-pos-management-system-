<?php

namespace App\Modules\Discount\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Settings\Persistence\Models\SysStatus;
use App\Modules\Customer\Persistence\Models\Customer;

class Coupon extends Model
{
    protected $table = 'coupons';

    protected $fillable = [
        'code',
        'discount_id',
        'customer_id',
        'usage_limit',
        'usage_count',
        'per_customer_limit',
        'start_at',
        'end_at',
        'status_id',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'usage_limit' => 'integer',
        'usage_count' => 'integer',
        'per_customer_limit' => 'integer',
    ];

    public function discount()
    {
        return $this->belongsTo(Discount::class, 'discount_id');
    }

    public function status()
    {
        return $this->belongsTo(SysStatus::class, 'status_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function usages()
    {
        return $this->hasMany(CouponUsage::class, 'coupon_id');
    }

    public function isValidForAmount(float $amount): array
    {
        $now = now();
        if ($this->start_at && $now->lt($this->start_at)) {
            return ['valid' => false, 'message' => 'Coupon is not yet active.'];
        }
        if ($this->end_at && $now->gt($this->end_at)) {
            return ['valid' => false, 'message' => 'Coupon has expired.'];
        }
        if ($this->usage_limit !== null && $this->usage_count >= $this->usage_limit) {
            return ['valid' => false, 'message' => 'Coupon usage limit reached.'];
        }

        $discount = $this->discount;
        if (!$discount) {
            return ['valid' => false, 'message' => 'Associated discount not found.'];
        }

        if ($discount->minimum_amount && $amount < (float)$discount->minimum_amount) {
            return [
                'valid' => false,
                'message' => 'Minimum spend of $' . number_format($discount->minimum_amount, 2) . ' required.'
            ];
        }

        // Calculate discount
        $calculatedDiscount = 0.0;
        if (strtoupper($discount->type) === 'PERCENTAGE') {
            $calculatedDiscount = ($amount * (float)$discount->value) / 100.0;
        } else {
            $calculatedDiscount = (float)$discount->value;
        }

        if ($discount->maximum_discount && $calculatedDiscount > (float)$discount->maximum_discount) {
            $calculatedDiscount = (float)$discount->maximum_discount;
        }

        $calculatedDiscount = min($amount, $calculatedDiscount);

        return [
            'valid' => true,
            'discount_amount' => round($calculatedDiscount, 2),
            'discount_type' => $discount->type,
            'discount_value' => (float)$discount->value,
            'coupon_id' => $this->id,
            'code' => $this->code,
            'name' => $discount->name,
        ];
    }
}
