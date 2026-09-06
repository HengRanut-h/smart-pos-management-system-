<?php

namespace App\Modules\Employee\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\User\Persistence\Models\User;

class Employee extends Model
{
    use SoftDeletes;

    protected $table = 'employees';
    protected $guarded = ['id'];

    protected $casts = [
        'hourly_rate' => 'float',
        'ot_hourly_rate' => 'float',
        'ot_multiplier' => 'float',
        'late_deduction_per_min' => 'float',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function user()
    {
        return $this->hasOne(User::class, 'employee_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'employee_id');
    }

    public function todayAttendance()
    {
        return $this->hasOne(Attendance::class, 'employee_id')
            ->where('date', now()->toDateString())
            ->latest('id');
    }
}
