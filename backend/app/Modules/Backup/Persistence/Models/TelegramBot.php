<?php

namespace App\Modules\Backup\Persistence\Models;

use Illuminate\Database\Eloquent\Model;

class TelegramBot extends Model
{
    protected $table = 'telegram_bots';
    protected $guarded = ['id'];

    protected $casts = [
        'notify_backup_success' => 'boolean',
        'notify_backup_failed' => 'boolean',
        'notify_storage_warning' => 'boolean',
        'notify_security_alerts' => 'boolean',
        'notify_restore_events' => 'boolean',
        'attach_backup_file' => 'boolean',
    ];
}
