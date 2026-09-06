<?php

namespace App\Modules\POS\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\User\Persistence\Models\User;

class CashMovement extends Model
{
    public $timestamps = false;
    protected $table = 'cash_movements';
    protected $guarded = ['id'];

    protected $casts = [
        'amount' => 'decimal:4',
        'created_at' => 'datetime',
    ];

    public function shift()
    {
        return $this->belongsTo(Shift::class, 'shift_id');
    }

    public function register()
    {
        return $this->belongsTo(PosRegister::class, 'register_id');
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }
}
