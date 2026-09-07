<?php

namespace App\Modules\Delivery\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\Customer\Persistence\Models\Customer;

class DeliveryRating extends Model
{
    protected $table = 'delivery_ratings';

    protected $guarded = ['id'];

    protected $casts = [
        'overall_rating' => 'float',
        'driver_rating' => 'float',
        'speed_rating' => 'float',
        'communication_rating' => 'float',
        'package_rating' => 'float',
    ];

    public function delivery(): BelongsTo
    {
        return $this->belongsTo(Delivery::class, 'delivery_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(DeliveryDriver::class, 'driver_id');
    }
}
