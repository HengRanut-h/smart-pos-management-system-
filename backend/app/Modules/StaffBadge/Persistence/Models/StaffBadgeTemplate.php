<?php

namespace App\Modules\StaffBadge\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Modules\Organization\Persistence\Models\Branch;

class StaffBadgeTemplate extends Model
{
    use SoftDeletes;

    protected $table = 'staff_badge_templates';
    protected $guarded = ['id'];

    protected $casts = [
        'front_design' => 'array',
        'back_design' => 'array',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'width_mm' => 'float',
        'height_mm' => 'float',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function badges()
    {
        return $this->hasMany(StaffBadge::class, 'template_id');
    }

    public function versions()
    {
        return $this->hasMany(StaffBadgeTemplateVersion::class, 'template_id')->latest('version_number');
    }
}
