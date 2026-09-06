<?php

namespace App\Modules\Payment\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use App\Modules\Sales\Persistence\Models\Sale;
use App\Modules\User\Persistence\Models\User;

class Payment extends Model
{
    protected $table = 'payments';
    protected $guarded = ['id'];

    protected $casts = [
        'amount' => 'decimal:4',
        'exchange_rate' => 'decimal:8',
        'paid_at' => 'datetime',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    public function method()
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
