<?php

namespace App\Modules\Return\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Sales\Persistence\Models\Sale;
use App\Modules\Customer\Persistence\Models\Customer;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\Warehouse\Persistence\Models\Warehouse;
use App\Modules\User\Persistence\Models\User;

class ReturnModel extends Model
{
    protected $table = 'returns';
    protected $guarded = ['id'];

    protected $casts = [
        'subtotal' => 'decimal:4',
        'refund_amount' => 'decimal:4',
        'return_date' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
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

    public function items()
    {
        return $this->hasMany(ReturnItem::class, 'return_id');
    }
}
