<?php

namespace App\Modules\Invoice\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Organization\Persistence\Models\Branch;

class InvoiceTemplateAssignment extends Model
{
    protected $table = 'invoice_template_assignments';
    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
        'priority' => 'integer',
    ];

    public function template()
    {
        return $this->belongsTo(InvoiceTemplate::class, 'template_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
