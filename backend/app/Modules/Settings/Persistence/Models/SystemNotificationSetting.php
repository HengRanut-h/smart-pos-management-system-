<?php

namespace App\Modules\Settings\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Organization\Persistence\Models\Branch;

class SystemNotificationSetting extends Model
{
    protected $table = 'system_notification_settings';
    protected $guarded = ['id'];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
