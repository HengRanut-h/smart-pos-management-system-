<?php

namespace App\Modules\Settings\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Organization\Persistence\Models\Branch;

class BranchBusinessHour extends Model
{
    protected $table = 'branch_business_hours';
    protected $guarded = ['id'];

    protected $casts = [
        'is_open' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
