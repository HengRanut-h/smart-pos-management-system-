<?php

namespace App\Modules\StaffBadge\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Employee\Persistence\Models\Employee;

class StaffBadgeScanLog extends Model
{
    protected $table = 'staff_badge_scan_logs';
    protected $guarded = ['id'];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function badge()
    {
        return $this->belongsTo(StaffBadge::class, 'badge_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
