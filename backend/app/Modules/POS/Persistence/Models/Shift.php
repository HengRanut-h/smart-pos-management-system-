<?php

namespace App\Modules\POS\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\User\Persistence\Models\User;
use App\Modules\Sales\Persistence\Models\Sale;

class Shift extends Model
{
    protected $table = 'shifts';
    protected $guarded = ['id'];

    protected $casts = [
        'opening_cash' => 'decimal:4',
        'expected_cash' => 'decimal:4',
        'actual_cash' => 'decimal:4',
        'cash_difference' => 'decimal:4',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function register()
    {
        return $this->belongsTo(PosRegister::class, 'register_id');
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function closedBy()
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function cashMovements()
    {
        return $this->hasMany(CashMovement::class, 'shift_id');
    }

    public function sales()
    {
        return $this->hasMany(Sale::class, 'created_by', 'cashier_id')
            ->where('created_at', '>=', $this->opened_at)
            ->when($this->closed_at, function ($q) {
                $q->where('created_at', '<=', $this->closed_at);
            });
    }
}
