<?php

namespace App\Modules\Product\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductBom extends Model
{
    protected $table = 'product_boms';

    protected $fillable = [
        'parent_product_id',
        'raw_material_product_id',
        'quantity_required',
        'unit_cost',
        'waste_percentage',
        'scrap_rate',
    ];

    protected $casts = [
        'quantity_required' => 'float',
        'unit_cost' => 'float',
        'waste_percentage' => 'float',
        'scrap_rate' => 'float',
    ];

    public function parentProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'parent_product_id');
    }

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'raw_material_product_id');
    }
}