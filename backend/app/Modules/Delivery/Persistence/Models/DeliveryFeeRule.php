<?php

namespace App\Modules\Delivery\Persistence\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryFeeRule extends Model
{
    protected $table = 'delivery_fee_rules';

    protected $guarded = ['id'];

    protected $casts = [
        'min_order_value' => 'float',
        'max_order_value' => 'float',
        'min_distance_km' => 'float',
        'max_distance_km' => 'float',
        'fee_amount' => 'float',
        'is_free' => 'boolean',
        'peak_hour_surcharge' => 'float',
        'weekend_surcharge' => 'float',
        'holiday_surcharge' => 'float',
        'is_active' => 'boolean',
    ];
}
