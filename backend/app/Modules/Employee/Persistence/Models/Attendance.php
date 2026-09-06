<?php

namespace App\Modules\Employee\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Organization\Persistence\Models\Branch;
use Carbon\Carbon;

class Attendance extends Model
{
    protected $table = 'attendances';
    protected $guarded = ['id'];

    protected $casts = [
        'date' => 'date',
        'clock_in' => 'datetime',
        'clock_out' => 'datetime',
        'total_minutes' => 'integer',
    ];

    protected $appends = ['formatted_duration', 'is_on_duty'];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function store()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function qrCode()
    {
        return $this->belongsTo(AttendanceQrCode::class, 'attendance_qr_code_id');
    }

    public function getFormattedDurationAttribute(): string
    {
        $minutes = $this->total_minutes ?? 0;
        if ($minutes <= 0 && $this->clock_in && !$this->clock_out) {
            $minutes = Carbon::parse($this->clock_in)->diffInMinutes(now());
        }
        $hours = floor($minutes / 60);
        $mins = $minutes % 60;
        return sprintf('%dh %02dm', $hours, $mins);
    }

    public function getIsOnDutyAttribute(): bool
    {
        return !is_null($this->clock_in) && is_null($this->clock_out);
    }
}
