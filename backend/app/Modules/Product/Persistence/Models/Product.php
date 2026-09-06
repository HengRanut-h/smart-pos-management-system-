<?php

namespace App\Modules\Product\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Modules\Category\Persistence\Models\Category;
use App\Modules\Brand\Persistence\Models\Brand;
use App\Modules\Unit\Persistence\Models\Unit;
use App\Modules\Inventory\Persistence\Models\Stock;

class Product extends Model
{
    use SoftDeletes;

    protected $table = 'products';
    protected $guarded = ['id'];

    protected $casts = [
        'cost_price' => 'decimal:4',
        'selling_price' => 'decimal:4',
        'tax_rate' => 'decimal:4',
        'reorder_level' => 'decimal:4',
        'min_stock' => 'decimal:4',
        'max_stock' => 'decimal:4',
        'weight' => 'decimal:4',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function stocks()
    {
        return $this->hasMany(Stock::class, 'product_id');
    }
}
