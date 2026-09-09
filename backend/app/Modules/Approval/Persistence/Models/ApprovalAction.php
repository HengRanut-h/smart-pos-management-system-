<?php

namespace App\Modules\Approval\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\User\Persistence\Models\User;

class ApprovalAction extends Model
{
    protected $table = 'approval_actions';
    protected $guarded = ['id'];

    public function request()
    {
        return $this->belongsTo(ApprovalRequest::class, 'request_id');
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
