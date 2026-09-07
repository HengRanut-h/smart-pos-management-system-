<?php

namespace App\Modules\Delivery\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryVehicleMaintenance extends Model
{
    protected $table = 'delivery_vehicle_maintenance';

    protected $guarded = ['id'];

    protected $casts = [
        'cost' => 'float',
        'mileage_at_service' => 'float',
        'service_date' => 'date',
    ];

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(DeliveryVehicle::class, 'vehicle_id');
    }
}
