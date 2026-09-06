<?php

namespace App\Modules\Warehouse\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\Inventory\Persistence\Models\Stock;

class Warehouse extends Model
{
    use SoftDeletes;

    protected $table = 'warehouses';
    protected $guarded = ['id'];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function stocks()
    {
        return $this->hasMany(Stock::class, 'warehouse_id');
    }
}
