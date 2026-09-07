<?php

namespace App\Modules\Delivery\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryRouteStop extends Model
{
    protected $table = 'delivery_route_stops';

    protected $guarded = ['id'];

    protected $casts = [
        'sequence_order' => 'integer',
        'actual_arrival_time' => 'datetime',
        'distance_from_prev_km' => 'float',
    ];

    public function route(): BelongsTo
    {
        return $this->belongsTo(DeliveryRoute::class, 'route_id');
    }

    public function delivery(): BelongsTo
    {
        return $this->belongsTo(Delivery::class, 'delivery_id');
    }
}
