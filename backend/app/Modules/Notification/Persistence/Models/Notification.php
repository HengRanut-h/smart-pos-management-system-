<?php

namespace App\Modules\Notification\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\User\Persistence\Models\User;

class Notification extends Model
{
    protected $table = 'notifications';
    protected $guarded = ['id'];

    protected $casts = [
        'read_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
