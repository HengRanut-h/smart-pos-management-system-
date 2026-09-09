<?php

namespace App\Modules\StaffBadge\Persistence\Models;

use Illuminate\Database\Eloquent\Model;

class StaffBadgeTemplateVersion extends Model
{
    protected $table = 'staff_badge_template_versions';
    protected $guarded = ['id'];

    protected $casts = [
        'front_design' => 'array',
        'back_design' => 'array',
    ];

    public function template()
    {
        return $this->belongsTo(StaffBadgeTemplate::class, 'template_id');
    }
}
