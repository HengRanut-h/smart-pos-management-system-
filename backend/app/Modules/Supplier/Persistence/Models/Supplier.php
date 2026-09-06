<?php

namespace App\Modules\Supplier\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use SoftDeletes;

    protected $table = 'suppliers';
    protected $guarded = ['id'];

    protected $casts = [
        'credit_limit' => 'decimal:4',
    ];
}
