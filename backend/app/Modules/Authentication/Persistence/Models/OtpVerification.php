<?php

namespace App\Modules\Authentication\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\User\Persistence\Models\User;

class OtpVerification extends Model
{
    protected $table = 'otp_verifications';
    protected $guarded = ['id'];

    protected $casts = [
        'expires_at' => 'datetime',
        'cooldown_until' => 'datetime',
        'verified_at' => 'datetime',
        'reset_token_expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
