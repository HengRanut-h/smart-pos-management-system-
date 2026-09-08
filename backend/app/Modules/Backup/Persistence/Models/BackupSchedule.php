<?php

namespace App\Modules\Backup\Persistence\Models;

use Illuminate\Database\Eloquent\Model;

class BackupSchedule extends Model
{
    protected $table = 'backup_schedules';
    protected $guarded = ['id'];

    protected $casts = [
        'is_compressed' => 'boolean',
        'is_encrypted' => 'boolean',
        'notify_on_success' => 'boolean',
        'notify_on_failure' => 'boolean',
        'last_run_at' => 'datetime',
        'next_run_at' => 'datetime',
    ];
}
