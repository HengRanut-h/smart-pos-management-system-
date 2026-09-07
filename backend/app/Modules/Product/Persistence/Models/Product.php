<?php

namespace App\Modules\Product\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Modules\Category\Persistence\Models\Category;
use App\Modules\Brand\Persistence\Models\Brand;
use App\Modules\Unit\Persistence\Models\Unit;
use App\Modules\Settings\Persistence\Models\SysStatus;

class Product extends Model
{
    use SoftDeletes;

    protected $table = 'products';

    protected $fillable = [
        'sku',
        'barcode',
        'name',
        'product_type',
        'product_code',
        'description',
        'short_description',
        'image_url',
        'gallery_images',
        'tags',
        'category_id',
        'brand_id',
        'unit_id',
        'cost_price',
        'landed_cost',
        'shipping_cost',
        'import_tax',
        'handling_cost',
        'other_expenses',
        'selling_price',
        'wholesale_price',
        'vip_price',
        'member_price',
        'online_price',
        'tax_rate',
        'reorder_level',
        'min_stock',
        'max_stock',
        'safety_stock',
        'reorder_quantity',
        'opening_stock',
        'damaged_stock',
        'expired_stock',
        'in_transit_stock',
        'weight',
        'dimensions',
        'seo_slug',
        'seo_title',
        'seo_description',
        'meta_keywords',
        'is_featured',
        'is_new',
        'is_discontinued',
        'visibility',
        'rating_avg',
        'rating_count',
        'template_id',
        'status_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'gallery_images' => 'array',
        'tags' => 'array',
        'visibility' => 'array',
        'cost_price' => 'float',
        'landed_cost' => 'float',
        'shipping_cost' => 'float',
        'import_tax' => 'float',
        'handling_cost' => 'float',
        'other_expenses' => 'float',
        'selling_price' => 'float',
        'wholesale_price' => 'float',
        'vip_price' => 'float',
        'member_price' => 'float',
        'online_price' => 'float',
        'tax_rate' => 'float',
        'reorder_level' => 'float',
        'min_stock' => 'float',
        'max_stock' => 'float',
        'safety_stock' => 'float',
        'reorder_quantity' => 'float',
        'opening_stock' => 'float',
        'damaged_stock' => 'float',
        'expired_stock' => 'float',
        'in_transit_stock' => 'float',
        'weight' => 'float',
        'rating_avg' => 'float',
        'rating_count' => 'integer',
        'is_featured' => 'boolean',
        'is_new' => 'boolean',
        'is_discontinued' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(SysStatus::class, 'status_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class, 'product_id');
    }

    public function attributeValues(): HasMany
    {
        return $this->hasMany(ProductAttributeValue::class, 'product_id');
    }

    public function priceRules(): HasMany
    {
        return $this->hasMany(ProductPriceRule::class, 'product_id');
    }

    public function warehouseLocations(): HasMany
    {
        return $this->hasMany(ProductWarehouseLocation::class, 'product_id');
    }

    public function suppliers(): HasMany
    {
        return $this->hasMany(ProductSupplier::class, 'product_id');
    }

    public function bundleComponents(): HasMany
    {
        return $this->hasMany(ProductBundle::class, 'bundle_product_id');
    }

    public function bomItems(): HasMany
    {
        return $this->hasMany(ProductBom::class, 'parent_product_id');
    }

    public function batches(): HasMany
    {
        return $this->hasMany(ProductBatch::class, 'product_id');
    }

    public function serialNumbers(): HasMany
    {
        return $this->hasMany(ProductSerialNumber::class, 'product_id');
    }

    public function warranties(): HasMany
    {
        return $this->hasMany(ProductWarranty::class, 'product_id');
    }

    public function qcInspections(): HasMany
    {
        return $this->hasMany(ProductQcInspection::class, 'product_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class, 'product_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(ProductAuditLog::class, 'product_id');
    }

    public function priceHistory(): HasMany
    {
        return $this->hasMany(ProductPriceHistory::class, 'product_id');
    }
}