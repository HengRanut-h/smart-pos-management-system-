<?php

namespace App\Modules\Backup\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\User\Persistence\Models\User;

class TelegramLog extends Model
{
    protected $table = 'telegram_logs';
    protected $guarded = ['id'];

    protected $casts = [
        'request_payload' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
