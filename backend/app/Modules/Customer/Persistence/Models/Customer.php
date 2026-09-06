<?php

namespace App\Modules\Customer\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes;

    protected $table = 'customers';
    protected $guarded = ['id'];

    protected $casts = [
        'loyalty_points' => 'decimal:4',
        'credit_limit' => 'decimal:4',
        'date_of_birth' => 'date',
    ];
}
