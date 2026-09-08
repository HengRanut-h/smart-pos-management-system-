<?php

namespace App\Modules\Backup\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\User\Persistence\Models\User;

class BackupRecord extends Model
{
    protected $table = 'backup_records';
    protected $guarded = ['id'];

    protected $casts = [
        'is_compressed' => 'boolean',
        'is_encrypted' => 'boolean',
        'is_verified' => 'boolean',
        'metadata' => 'array',
        'expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function scopeSuccessful($query)
    {
        return $query->where('status', 'SUCCESS');
    }
}
