<?php

namespace App\Modules\Invoice\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Organization\Persistence\Models\Branch;

class InvoiceSequence extends Model
{
    protected $table = 'invoice_sequences';
    protected $guarded = ['id'];

    protected $casts = [
        'current_number' => 'integer',
        'padding' => 'integer',
        'is_active' => 'boolean',
        'last_reset_date' => 'date',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function generateNextNumber(?string $branchCode = null): string
    {
        $now = now();
        $shouldReset = false;

        if ($this->reset_frequency === 'YEARLY' && $this->last_reset_date && $this->last_reset_date->year !== $now->year) {
            $shouldReset = true;
        } elseif ($this->reset_frequency === 'MONTHLY' && $this->last_reset_date && ($this->last_reset_date->format('Y-m') !== $now->format('Y-m'))) {
            $shouldReset = true;
        } elseif ($this->reset_frequency === 'DAILY' && $this->last_reset_date && ($this->last_reset_date->format('Y-m-d') !== $now->format('Y-m-d'))) {
            $shouldReset = true;
        }

        if ($shouldReset) {
            $this->current_number = 1;
            $this->last_reset_date = $now->toDateString();
        } else {
            $this->current_number++;
            $this->last_reset_date = $now->toDateString();
        }
        $this->save();

        $numStr = str_pad((string)$this->current_number, $this->padding, '0', STR_PAD_LEFT);
        $pattern = $this->pattern ?: 'INV-{YYYY}-{####}';

        $replacements = [
            '{YYYY}' => $now->format('Y'),
            '{YY}' => $now->format('y'),
            '{MM}' => $now->format('m'),
            '{DD}' => $now->format('d'),
            '{YYYYMM}' => $now->format('Ym'),
            '{BRANCH}' => strtoupper($branchCode ?: 'HQ'),
            '{####}' => $numStr,
            '{###}' => str_pad((string)$this->current_number, 3, '0', STR_PAD_LEFT),
            '{#####}' => str_pad((string)$this->current_number, 5, '0', STR_PAD_LEFT),
            '{######}' => str_pad((string)$this->current_number, 6, '0', STR_PAD_LEFT),
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $pattern);
    }
}
