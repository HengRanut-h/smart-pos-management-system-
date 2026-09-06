<?php

namespace App\Modules\Audit\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\User\Persistence\Models\User;

class AuditLog extends Model
{
    public $timestamps = false;
    protected $table = 'audit_logs';
    protected $guarded = ['id'];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
