<?php

namespace App\Modules\Settings\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Organization\Persistence\Models\Branch;

class BranchHoliday extends Model
{
    protected $table = 'branch_holidays';
    protected $guarded = ['id'];

    protected $casts = [
        'is_closed' => 'boolean',
        'holiday_date' => 'date',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
