<?php

namespace App\Modules\Settings\Persistence\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $table = 'system_settings';
    protected $guarded = ['id'];

    protected $casts = [
        'is_public' => 'boolean',
    ];
}
