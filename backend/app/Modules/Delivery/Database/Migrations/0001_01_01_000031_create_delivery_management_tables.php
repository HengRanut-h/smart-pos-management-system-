<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Delivery Zones
        if (!Schema::hasTable('delivery_zones')) {
            Schema::create('delivery_zones', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code')->unique();
                $table->text('area_description')->nullable();
                $table->decimal('base_delivery_fee', 10, 2)->default(0);
                $table->decimal('per_km_fee', 10, 2)->default(0);
                $table->decimal('min_order_amount', 10, 2)->default(0);
                $table->decimal('free_delivery_threshold', 10, 2)->nullable();
                $table->integer('estimated_delivery_minutes')->default(30);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 2. Delivery Drivers / Riders
        if (!Schema::hasTable('delivery_drivers')) {
            Schema::create('delivery_drivers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete();
                $table->string('name');
                $table->string('phone');
                $table->string('vehicle_type')->default('MOTORCYCLE'); // MOTORCYCLE, BICYCLE, CAR, VAN, TRUCK
                $table->string('vehicle_plate_number')->nullable();
                $table->string('driver_license_number')->nullable();
                $table->date('driver_license_expiry')->nullable();
                $table->string('current_status')->default('AVAILABLE'); // AVAILABLE, BUSY, ON_DELIVERY, OFFLINE, BREAK
                $table->decimal('current_latitude', 10, 7)->nullable();
                $table->decimal('current_longitude', 10, 7)->nullable();
                $table->decimal('rating', 3, 2)->default(5.00);
                $table->integer('total_deliveries_completed')->default(0);
                $table->decimal('active_cash_in_hand', 10, 2)->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 3. Deliveries
        if (!Schema::hasTable('deliveries')) {
            Schema::create('deliveries', function (Blueprint $table) {
                $table->id();
                $table->string('delivery_number')->unique();
                $table->foreignId('sale_id')->nullable()->constrained('sales')->nullOnDelete();
                $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
                $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
                $table->foreignId('driver_id')->nullable()->constrained('delivery_drivers')->nullOnDelete();
                $table->foreignId('zone_id')->nullable()->constrained('delivery_zones')->nullOnDelete();

                // Status pipeline: PENDING, ASSIGNED, ACCEPTED, PICKED_UP, IN_TRANSIT, ARRIVED, DELIVERED, FAILED, CANCELLED, RETURNED_TO_STORE
                $table->string('status')->default('PENDING');

                // Recipient & Address
                $table->string('recipient_name');
                $table->string('recipient_phone');
                $table->string('recipient_secondary_phone')->nullable();
                $table->text('delivery_address');
                $table->decimal('delivery_latitude', 10, 7)->nullable();
                $table->decimal('delivery_longitude', 10, 7)->nullable();
                $table->text('delivery_notes')->nullable();
                $table->string('priority')->default('STANDARD'); // STANDARD, EXPRESS, URGENT

                // Financials & Payment
                $table->string('payment_type')->default('COD'); // PREPAID, COD, PARTIAL
                $table->decimal('cod_amount_due', 10, 2)->default(0);
                $table->decimal('cod_amount_collected', 10, 2)->default(0);
                $table->decimal('delivery_fee', 10, 2)->default(0);
                $table->decimal('order_subtotal', 10, 2)->default(0);
                $table->decimal('total_amount', 10, 2)->default(0);

                // Timestamps & Milestones
                $table->timestamp('scheduled_at')->nullable();
                $table->timestamp('assigned_at')->nullable();
                $table->timestamp('picked_up_at')->nullable();
                $table->timestamp('delivered_at')->nullable();
                $table->string('estimated_delivery_time')->nullable();
                $table->integer('actual_delivery_minutes')->nullable();

                // Failure & Rescheduling
                $table->string('failure_reason_code')->nullable(); // CUSTOMER_UNAVAILABLE, WRONG_ADDRESS, CUSTOMER_REJECTED, PHONE_UNREACHABLE, PAYMENT_ISSUE, DAMAGED_ITEM
                $table->text('failure_notes')->nullable();
                $table->integer('reschedule_count')->default(0);

                $table->timestamps();
            });
        }

        // 4. Delivery Items
        if (!Schema::hasTable('delivery_items')) {
            Schema::create('delivery_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('delivery_id')->constrained('deliveries')->cascadeOnDelete();
                $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
                $table->string('product_name');
                $table->string('sku')->nullable();
                $table->integer('quantity')->default(1);
                $table->decimal('unit_price', 10, 2)->default(0);
                $table->decimal('total_price', 10, 2)->default(0);
                $table->text('image_url')->nullable();
                $table->timestamps();
            });
        }

        // 5. Delivery Tracking Logs
        if (!Schema::hasTable('delivery_tracking_logs')) {
            Schema::create('delivery_tracking_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('delivery_id')->constrained('deliveries')->cascadeOnDelete();
                $table->string('status');
                $table->string('actor_type')->default('SYSTEM'); // SYSTEM, DISPATCHER, DRIVER, CUSTOMER
                $table->unsignedBigInteger('actor_id')->nullable();
                $table->string('actor_name')->nullable();
                $table->text('notes')->nullable();
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->timestamp('created_at')->useCurrent();
            });
        }

        // 6. Delivery Proofs (POD)
        if (!Schema::hasTable('delivery_proofs')) {
            Schema::create('delivery_proofs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('delivery_id')->constrained('deliveries')->cascadeOnDelete();
                $table->string('receiver_name')->nullable();
                $table->string('receiver_relationship')->nullable(); // SELF, FAMILY, SECURITY, RECEPTIONIST, NEIGHBOR
                $table->longText('signature_image_url')->nullable();
                $table->text('delivery_photo_url')->nullable();
                $table->string('otp_code')->nullable();
                $table->timestamp('otp_verified_at')->nullable();
                $table->decimal('delivered_latitude', 10, 7)->nullable();
                $table->decimal('delivered_longitude', 10, 7)->nullable();
                $table->timestamp('created_at')->useCurrent();
            });
        }

        // 7. Driver COD Settlements
        if (!Schema::hasTable('driver_cod_settlements')) {
            Schema::create('driver_cod_settlements', function (Blueprint $table) {
                $table->id();
                $table->string('settlement_number')->unique();
                $table->foreignId('driver_id')->constrained('delivery_drivers')->cascadeOnDelete();
                $table->decimal('total_cod_collected', 10, 2)->default(0);
                $table->decimal('total_delivery_fees', 10, 2)->default(0);
                $table->decimal('net_amount_settled', 10, 2)->default(0);
                $table->string('settlement_status')->default('PENDING'); // PENDING, VERIFIED, RECONCILED
                $table->foreignId('settled_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->text('notes')->nullable();
                $table->timestamp('settled_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_cod_settlements');
        Schema::dropIfExists('delivery_proofs');
        Schema::dropIfExists('delivery_tracking_logs');
        Schema::dropIfExists('delivery_items');
        Schema::dropIfExists('deliveries');
        Schema::dropIfExists('delivery_drivers');
        Schema::dropIfExists('delivery_zones');
    }
};
