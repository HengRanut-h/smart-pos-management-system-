<?php

namespace App\Modules\Delivery\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryRoute extends Model
{
    protected $table = 'delivery_routes';

    protected $guarded = ['id'];

    protected $casts = [
        'route_date' => 'date',
        'total_distance_km' => 'float',
        'estimated_duration_minutes' => 'integer',
        'total_stops' => 'integer',
        'completed_stops' => 'integer',
    ];

    public function driver(): BelongsTo
    {
        return $this->belongsTo(DeliveryDriver::class, 'driver_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(DeliveryVehicle::class, 'vehicle_id');
    }

    public function stops(): HasMany
    {
        return $this->hasMany(DeliveryRouteStop::class, 'route_id')->orderBy('sequence_order', 'asc');
    }
}
