<?php

namespace App\Modules\Purchasing\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Supplier\Persistence\Models\Supplier;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\Warehouse\Persistence\Models\Warehouse;
use App\Modules\User\Persistence\Models\User;

class Purchase extends Model
{
    protected $table = 'purchases';
    protected $guarded = ['id'];

    protected $casts = [
        'subtotal' => 'decimal:4',
        'discount_amount' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'shipping_amount' => 'decimal:4',
        'total_amount' => 'decimal:4',
        'paid_amount' => 'decimal:4',
        'balance_amount' => 'decimal:4',
        'purchase_date' => 'datetime',
        'expected_date' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items()
    {
        return $this->hasMany(PurchaseItem::class, 'purchase_id');
    }

    public function status()
    {
        return $this->belongsTo(\App\Modules\Settings\Persistence\Models\SysStatus::class, 'status_id');
    }
}
