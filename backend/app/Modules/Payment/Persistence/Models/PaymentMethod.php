<?php

namespace App\Modules\Payment\Persistence\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    protected $table = 'payment_methods';
    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
