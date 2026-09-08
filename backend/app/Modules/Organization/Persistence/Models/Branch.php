<?php

namespace App\Modules\Organization\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Modules\Warehouse\Persistence\Models\Warehouse;
use App\Modules\Employee\Persistence\Models\Employee;
use App\Modules\Settings\Persistence\Models\BranchSetting;
use App\Modules\Settings\Persistence\Models\BranchUser;
use App\Modules\Settings\Persistence\Models\BranchPosTerminal;
use App\Modules\Settings\Persistence\Models\BranchPrinter;
use App\Modules\Settings\Persistence\Models\BranchNumberSequence;
use App\Modules\Settings\Persistence\Models\BranchBusinessHour;
use App\Modules\Settings\Persistence\Models\BranchHoliday;

class Branch extends Model
{
    use SoftDeletes;

    protected $table = 'branches';
    protected $guarded = ['id'];

    protected $casts = [
        'opening_date' => 'date',
        'tax_rate' => 'float',
    ];

    public function warehouses()
    {
        return $this->hasMany(Warehouse::class, 'branch_id');
    }

    public function employees()
    {
        return $this->hasMany(Employee::class, 'branch_id');
    }

    public function branchSettings()
    {
        return $this->hasMany(BranchSetting::class, 'branch_id');
    }

    public function branchUsers()
    {
        return $this->hasMany(BranchUser::class, 'branch_id');
    }

    public function posTerminals()
    {
        return $this->hasMany(BranchPosTerminal::class, 'branch_id');
    }

    public function printers()
    {
        return $this->hasMany(BranchPrinter::class, 'branch_id');
    }

    public function numberSequences()
    {
        return $this->hasMany(BranchNumberSequence::class, 'branch_id');
    }

    public function businessHours()
    {
        return $this->hasMany(BranchBusinessHour::class, 'branch_id')->orderBy('day_of_week');
    }

    public function holidays()
    {
        return $this->hasMany(BranchHoliday::class, 'branch_id')->orderBy('holiday_date');
    }
}
