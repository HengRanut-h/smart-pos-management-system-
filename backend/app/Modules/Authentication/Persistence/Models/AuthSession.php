<?php

namespace App\Modules\Authentication\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\User\Persistence\Models\User;

class AuthSession extends Model
{
    protected $table = 'auth_sessions';
    protected $guarded = ['id'];

    protected $casts = [
        'is_revoked' => 'boolean',
        'last_activity_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function revoke(): bool
    {
        return $this->update(['is_revoked' => true]);
    }

    public function isValid(): bool
    {
        if ($this->is_revoked) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }
}
