<?php

namespace App\Modules\Unit\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Product\Persistence\Models\Product;

class Unit extends Model
{
    protected $table = 'units';
    protected $guarded = ['id'];

    public function products()
    {
        return $this->hasMany(Product::class, 'unit_id');
    }
}
