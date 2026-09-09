<?php

namespace App\Modules\Approval\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\User\Persistence\Models\User;
use App\Modules\Organization\Persistence\Models\Branch;

class ApprovalRequest extends Model
{
    protected $table = 'approval_requests';
    protected $guarded = ['id'];

    protected $casts = [
        'amount' => 'decimal:2',
        'payload_snapshot' => 'array',
        'decided_at' => 'datetime',
    ];

    public function workflow()
    {
        return $this->belongsTo(ApprovalWorkflow::class, 'workflow_id');
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function decider()
    {
        return $this->belongsTo(User::class, 'decided_by');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function actions()
    {
        return $this->hasMany(ApprovalAction::class, 'request_id')->orderBy('created_at', 'asc');
    }
}
