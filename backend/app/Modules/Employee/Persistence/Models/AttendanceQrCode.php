<?php

namespace App\Modules\Employee\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Organization\Persistence\Models\Branch;

class AttendanceQrCode extends Model
{
    protected $table = 'attendance_qr_codes';
    protected $guarded = ['id'];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function store()
    {
        return $this->belongsTo(Branch::class, 'store_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'attendance_qr_code_id');
    }
}
