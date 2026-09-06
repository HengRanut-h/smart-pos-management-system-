<?php

namespace App\Modules\Settings\Persistence\Models;

use Illuminate\Database\Eloquent\Model;

class SysStatus extends Model
{
    protected $table = 'sys_statuses';
    protected $guarded = ['id'];
}
