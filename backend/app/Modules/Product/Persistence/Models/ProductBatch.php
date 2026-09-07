<?php

namespace App\Modules\Product\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\Supplier\Persistence\Models\Supplier;
use App\Modules\Warehouse\Persistence\Models\Warehouse;

class ProductBatch extends Model
{
    protected $table = 'product_batches';

    protected $fillable = [
        'product_id',
        'batch_number',
        'lot_number',
        'manufacturing_date',
        'expiry_date',
        'quantity',
        'supplier_id',
        'unit_cost',
        'warehouse_id',
        'status',
    ];

    protected $casts = [
        'quantity' => 'float',
        'unit_cost' => 'float',
        'manufacturing_date' => 'date',
        'expiry_date' => 'date',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }
}