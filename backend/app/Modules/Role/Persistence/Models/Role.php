<?php

namespace App\Modules\Role\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Modules\User\Persistence\Models\User;
use App\Modules\Permission\Persistence\Models\Permission;

class Role extends Model
{
    use SoftDeletes;

    protected $table = 'roles';
    protected $guarded = ['id'];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_roles', 'role_id', 'user_id');
    }

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permissions', 'role_id', 'permission_id')
                    ->withPivot('assigned_at');
    }
}
