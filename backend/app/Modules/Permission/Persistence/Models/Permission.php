<?php

namespace App\Modules\Permission\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Role\Persistence\Models\Role;

class Permission extends Model
{
    protected $table = 'permissions';
    protected $guarded = ['id'];

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_permissions', 'permission_id', 'role_id');
    }
}
