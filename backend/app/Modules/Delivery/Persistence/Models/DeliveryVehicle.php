<?php

namespace App\Modules\Delivery\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryVehicle extends Model
{
    protected $table = 'delivery_vehicles';

    protected $guarded = ['id'];

    protected $casts = [
        'capacity_kg' => 'float',
        'mileage_km' => 'float',
        'next_service_date' => 'date',
    ];

    public function assignedDriver(): BelongsTo
    {
        return $this->belongsTo(DeliveryDriver::class, 'assigned_driver_id');
    }

    public function maintenanceLogs(): HasMany
    {
        return $this->hasMany(DeliveryVehicleMaintenance::class, 'vehicle_id');
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class, 'vehicle_id');
    }
}
