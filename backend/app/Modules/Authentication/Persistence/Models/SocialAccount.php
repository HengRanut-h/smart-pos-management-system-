<?php

namespace App\Modules\Authentication\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\User\Persistence\Models\User;

class SocialAccount extends Model
{
    protected $table = 'social_accounts';
    protected $guarded = ['id'];

    protected $casts = [
        'raw_user_data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
