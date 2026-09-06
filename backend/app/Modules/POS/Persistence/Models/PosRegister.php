<?php

namespace App\Modules\POS\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Organization\Persistence\Models\Branch;

class PosRegister extends Model
{
    protected $table = 'registers';
    protected $guarded = ['id'];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function shifts()
    {
        return $this->hasMany(Shift::class, 'register_id');
    }

    public function cashDrawers()
    {
        return $this->hasMany(CashDrawer::class, 'register_id');
    }
}
