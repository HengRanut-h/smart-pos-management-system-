<?php

namespace App\Modules\Delivery\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Modules\Employee\Persistence\Models\Employee;

class DeliveryDriver extends Model
{
    protected $table = 'delivery_drivers';
    protected $guarded = ['id'];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class, 'driver_id');
    }

    public function settlements(): HasMany
    {
        return $this->hasMany(DriverCodSettlement::class, 'driver_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(DeliveryVehicle::class, 'id', 'assigned_driver_id');
    }

    public function routes(): HasMany
    {
        return $this->hasMany(DeliveryRoute::class, 'driver_id');
    }
}
