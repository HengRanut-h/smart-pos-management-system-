<?php

namespace App\Modules\Product\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductQcInspection extends Model
{
    protected $table = 'product_qc_inspections';

    protected $fillable = [
        'product_id',
        'batch_id',
        'inspection_date',
        'inspector_name',
        'sample_size',
        'passed_quantity',
        'failed_quantity',
        'defect_type',
        'status',
        'notes',
    ];

    protected $casts = [
        'inspection_date' => 'date',
        'sample_size' => 'integer',
        'passed_quantity' => 'integer',
        'failed_quantity' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ProductBatch::class, 'batch_id');
    }
}