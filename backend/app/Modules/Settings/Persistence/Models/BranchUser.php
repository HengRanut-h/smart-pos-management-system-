<?php

namespace App\Modules\Settings\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\User\Persistence\Models\User;

class BranchUser extends Model
{
    protected $table = 'branch_users';
    protected $guarded = ['id'];

    protected $casts = [
        'permissions' => 'array',
        'is_active' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
