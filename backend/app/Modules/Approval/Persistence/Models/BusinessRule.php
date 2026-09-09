<?php

namespace App\Modules\Approval\Persistence\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessRule extends Model
{
    protected $table = 'business_rules';
    protected $guarded = ['id'];

    protected $casts = [
        'condition_expression' => 'array',
        'action_payload' => 'array',
        'priority' => 'integer',
        'is_active' => 'boolean',
    ];
}
