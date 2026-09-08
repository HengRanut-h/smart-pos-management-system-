<?php

namespace App\Modules\Settings\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Organization\Persistence\Models\Branch;

class BranchSetting extends Model
{
    protected $table = 'branch_settings';
    protected $guarded = ['id'];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
