<?php

namespace App\Modules\StaffBadge\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Modules\Employee\Persistence\Models\Employee;

class StaffBadge extends Model
{
    use SoftDeletes;

    protected $table = 'staff_badges';
    protected $guarded = ['id'];

    protected $casts = [
        'custom_fields' => 'array',
        'issued_at' => 'datetime',
        'activated_at' => 'datetime',
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function template()
    {
        return $this->belongsTo(StaffBadgeTemplate::class, 'template_id');
    }

    public function scanLogs()
    {
        return $this->hasMany(StaffBadgeScanLog::class, 'badge_id')->latest('id');
    }

    public function auditLogs()
    {
        return $this->hasMany(StaffBadgeAuditLog::class, 'badge_id')->latest('id');
    }

    public function isUsable(): bool
    {
        if ($this->status !== 'ACTIVE') {
            return false;
        }
        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }
        return true;
    }
}
