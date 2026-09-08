<?php

namespace App\Modules\Settings\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\User\Persistence\Models\User;

class BranchPosTerminal extends Model
{
    protected $table = 'branch_pos_terminals';
    protected $guarded = ['id'];

    protected $casts = [
        'cash_drawer_enabled' => 'boolean',
        'auto_print' => 'boolean',
        'last_active_at' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function assignedCashier()
    {
        return $this->belongsTo(User::class, 'assigned_cashier_id');
    }
}
