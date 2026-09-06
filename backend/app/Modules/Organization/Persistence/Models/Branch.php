<?php

namespace App\Modules\Organization\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Modules\Warehouse\Persistence\Models\Warehouse;
use App\Modules\Employee\Persistence\Models\Employee;

class Branch extends Model
{
    use SoftDeletes;

    protected $table = 'branches';
    protected $guarded = ['id'];

    public function warehouses()
    {
        return $this->hasMany(Warehouse::class, 'branch_id');
    }

    public function employees()
    {
        return $this->hasMany(Employee::class, 'branch_id');
    }
}
