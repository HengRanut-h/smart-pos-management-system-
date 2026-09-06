<?php

namespace App\Modules\Discount\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Modules\Settings\Persistence\Models\SysStatus;
use App\Modules\User\Persistence\Models\User;

class Discount extends Model
{
    use SoftDeletes;

    protected $table = 'discounts';

    protected $fillable = [
        'code',
        'name',
        'type',
        'value',
        'minimum_amount',
        'maximum_discount',
        'start_at',
        'end_at',
        'usage_limit',
        'usage_count',
        'status_id',
        'created_by',
    ];

    protected $casts = [
        'value' => 'float',
        'minimum_amount' => 'float',
        'maximum_discount' => 'float',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'usage_limit' => 'integer',
        'usage_count' => 'integer',
    ];

    public function status()
    {
        return $this->belongsTo(SysStatus::class, 'status_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function coupons()
    {
        return $this->hasMany(Coupon::class, 'discount_id');
    }
}
