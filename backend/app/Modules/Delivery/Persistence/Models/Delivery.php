<?php

namespace App\Modules\Delivery\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Modules\Sales\Persistence\Models\Sale;
use App\Modules\Invoice\Persistence\Models\Invoice;
use App\Modules\Customer\Persistence\Models\Customer;

class Delivery extends Model
{
    protected $table = 'deliveries';
    protected $guarded = ['id'];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'assigned_at' => 'datetime',
        'picked_up_at' => 'datetime',
        'delivered_at' => 'datetime',
        'cod_amount_due' => 'decimal:2',
        'cod_amount_collected' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'order_subtotal' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(DeliveryDriver::class, 'driver_id');
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(DeliveryZone::class, 'zone_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(DeliveryItem::class, 'delivery_id');
    }

    public function trackingLogs(): HasMany
    {
        return $this->hasMany(DeliveryTrackingLog::class, 'delivery_id')->orderBy('created_at', 'asc');
    }

    public function proof(): HasOne
    {
        return $this->hasOne(DeliveryProof::class, 'delivery_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(DeliveryVehicle::class, 'vehicle_id');
    }

    public function timeSlot(): BelongsTo
    {
        return $this->belongsTo(DeliveryTimeSlot::class, 'time_slot_id');
    }

    public function route(): BelongsTo
    {
        return $this->belongsTo(DeliveryRoute::class, 'route_id');
    }

    public function supportTickets(): HasMany
    {
        return $this->hasMany(DeliverySupportTicket::class, 'delivery_id');
    }

    public function rating(): HasOne
    {
        return $this->hasOne(DeliveryRating::class, 'delivery_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(DeliveryAuditLog::class, 'delivery_id')->orderBy('created_at', 'desc');
    }
}
