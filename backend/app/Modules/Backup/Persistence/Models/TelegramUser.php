<?php

namespace App\Modules\Backup\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\User\Persistence\Models\User;

class TelegramUser extends Model
{
    protected $table = 'telegram_users';
    protected $guarded = ['id'];

    protected $casts = [
        'is_authorized' => 'boolean',
        'allowed_commands' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
