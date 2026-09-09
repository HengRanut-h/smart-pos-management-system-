<?php

namespace App\Modules\StaffBadge\Persistence\Models;

use Illuminate\Database\Eloquent\Model;

class StaffBadgeAuditLog extends Model
{
    protected $table = 'staff_badge_audit_logs';
    protected $guarded = ['id'];

    public function badge()
    {
        return $this->belongsTo(StaffBadge::class, 'badge_id');
    }
}
