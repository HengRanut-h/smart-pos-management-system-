<?php

namespace App\Modules\Invoice\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\User\Persistence\Models\User;

class InvoiceTemplate extends Model
{
    protected $table = 'invoice_templates';
    protected $guarded = ['id'];

    protected $casts = [
        'layout_config' => 'array',
        'styles_config' => 'array',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function versions()
    {
        return $this->hasMany(InvoiceTemplateVersion::class, 'template_id')->orderBy('version_number', 'desc');
    }

    public function assignments()
    {
        return $this->hasMany(InvoiceTemplateAssignment::class, 'template_id');
    }
}
