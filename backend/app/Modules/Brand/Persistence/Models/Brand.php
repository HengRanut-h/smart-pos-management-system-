<?php

namespace App\Modules\Brand\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Modules\Product\Persistence\Models\Product;

class Brand extends Model
{
    use SoftDeletes;

    protected $table = 'brands';
    protected $guarded = ['id'];

    public function products()
    {
        return $this->hasMany(Product::class, 'brand_id');
    }
}
