<?php

namespace App\Modules\Invoice\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\User\Persistence\Models\User;

class InvoiceTemplateVersion extends Model
{
    protected $table = 'invoice_template_versions';
    protected $guarded = ['id'];

    protected $casts = [
        'layout_config' => 'array',
        'styles_config' => 'array',
        'version_number' => 'integer',
    ];

    public function template()
    {
        return $this->belongsTo(InvoiceTemplate::class, 'template_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
