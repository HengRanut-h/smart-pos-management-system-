<?php

namespace App\Modules\Delivery\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryZone extends Model
{
    protected $table = 'delivery_zones';
    protected $guarded = ['id'];

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class, 'zone_id');
    }
}
