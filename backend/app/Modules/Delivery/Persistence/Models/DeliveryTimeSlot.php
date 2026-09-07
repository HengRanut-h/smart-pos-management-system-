<?php

namespace App\Modules\Delivery\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryTimeSlot extends Model
{
    protected $table = 'delivery_time_slots';

    protected $guarded = ['id'];

    protected $casts = [
        'max_capacity' => 'integer',
        'current_bookings' => 'integer',
        'is_active' => 'boolean',
    ];

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class, 'time_slot_id');
    }
}
