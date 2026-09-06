<?php

namespace App\Modules\POS\Persistence\Models;

use Illuminate\Database\Eloquent\Model;

class CashDrawer extends Model
{
    protected $table = 'cash_drawers';
    protected $guarded = ['id'];

    protected $casts = [
        'opening_balance' => 'decimal:4',
        'current_balance' => 'decimal:4',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function register()
    {
        return $this->belongsTo(PosRegister::class, 'register_id');
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class, 'shift_id');
    }
}
