<?php

namespace App\Modules\Settings\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Organization\Persistence\Models\Branch;

class BranchPrinter extends Model
{
    protected $table = 'branch_printers';
    protected $guarded = ['id'];

    protected $casts = [
        'is_default' => 'boolean',
        'auto_cut' => 'boolean',
        'cash_drawer_kick' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
