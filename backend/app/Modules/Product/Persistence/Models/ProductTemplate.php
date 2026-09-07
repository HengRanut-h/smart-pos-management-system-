<?php

namespace App\Modules\Product\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\Category\Persistence\Models\Category;
use App\Modules\Brand\Persistence\Models\Brand;

class ProductTemplate extends Model
{
    protected $table = 'product_templates';

    protected $fillable = [
        'name',
        'category_id',
        'brand_id',
        'product_type',
        'default_attributes',
        'default_pricing',
    ];

    protected $casts = [
        'default_attributes' => 'array',
        'default_pricing' => 'array',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }
}