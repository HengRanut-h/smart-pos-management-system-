<?php

namespace App\Modules\Approval\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Organization\Persistence\Models\Branch;

class ApprovalWorkflow extends Model
{
    protected $table = 'approval_workflows';
    protected $guarded = ['id'];

    protected $casts = [
        'threshold_amount' => 'decimal:2',
        'auto_notify_telegram' => 'boolean',
        'is_active' => 'boolean',
        'escalation_timeout_hours' => 'integer',
    ];

    public function requests()
    {
        return $this->hasMany(ApprovalRequest::class, 'workflow_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
