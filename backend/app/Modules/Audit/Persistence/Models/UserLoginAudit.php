<?php

namespace App\Modules\Audit\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\User\Persistence\Models\User;

class UserLoginAudit extends Model
{
    protected $table = 'user_login_audits';
    protected $guarded = ['id'];

    protected $casts = [
        'is_suspicious' => 'boolean',
        'remember_me' => 'boolean',
        'two_factor_verified' => 'boolean',
        'login_at' => 'datetime',
        'logout_at' => 'datetime',
        'last_activity_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopeSuccessful($query)
    {
        return $query->where('status', 'SUCCESS');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'FAILED');
    }

    public function scopeSuspicious($query)
    {
        return $query->where('is_suspicious', true)->orWhere('status', 'SUSPICIOUS');
    }

    public function scopeActiveSessions($query)
    {
        return $query->where('status', 'SUCCESS')
            ->whereNull('logout_at')
            ->where(function ($q) {
                $q->whereNull('last_activity_at')
                  ->orWhere('last_activity_at', '>=', now()->subHours(24));
            });
    }
}
