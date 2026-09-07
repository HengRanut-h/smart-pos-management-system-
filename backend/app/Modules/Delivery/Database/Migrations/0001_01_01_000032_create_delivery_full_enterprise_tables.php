<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Delivery Vehicles
        if (!Schema::hasTable('delivery_vehicles')) {
            Schema::create('delivery_vehicles', function (Blueprint $table) {
                $table->id();
                $table->string('plate_number')->unique();
                $table->string('vehicle_type')->default('MOTORCYCLE'); // MOTORCYCLE, BICYCLE, CAR, VAN, TRUCK
                $table->string('brand')->nullable();
                $table->string('model')->nullable();
                $table->string('color')->nullable();
                $table->decimal('capacity_kg', 10, 2)->default(30);
                $table->string('fuel_type')->default('GASOLINE'); // GASOLINE, ELECTRIC, DIESEL, HYBRID, MANUAL
                $table->foreignId('assigned_driver_id')->nullable()->constrained('delivery_drivers')->nullOnDelete();
                $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
                $table->string('status')->default('AVAILABLE'); // AVAILABLE, ASSIGNED, IN_USE, MAINTENANCE, DAMAGED, INACTIVE
                $table->decimal('mileage_km', 12, 2)->default(0);
                $table->date('next_service_date')->nullable();
                $table->timestamps();
            });
        }

        // 2. Vehicle Maintenance Logs
        if (!Schema::hasTable('delivery_vehicle_maintenance')) {
            Schema::create('delivery_vehicle_maintenance', function (Blueprint $table) {
                $table->id();
                $table->foreignId('vehicle_id')->constrained('delivery_vehicles')->cascadeOnDelete();
                $table->string('service_type'); // OIL_CHANGE, TIRE_REPLACEMENT, BRAKE_SERVICE, ENGINE_REPAIR, GENERAL_INSPECTION
                $table->date('service_date');
                $table->decimal('cost', 10, 2)->default(0);
                $table->decimal('mileage_at_service', 12, 2)->default(0);
                $table->text('notes')->nullable();
                $table->string('technician_name')->nullable();
                $table->timestamps();
            });
        }

        // 3. Delivery Fee Rules
        if (!Schema::hasTable('delivery_fee_rules')) {
            Schema::create('delivery_fee_rules', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('rule_type')->default('ORDER_VALUE'); // FIXED, DISTANCE_BASED, ORDER_VALUE, WEIGHT_BASED, SURCHARGE
                $table->decimal('min_order_value', 10, 2)->default(0);
                $table->decimal('max_order_value', 10, 2)->nullable();
                $table->decimal('min_distance_km', 10, 2)->default(0);
                $table->decimal('max_distance_km', 10, 2)->nullable();
                $table->decimal('fee_amount', 10, 2)->default(0);
                $table->boolean('is_free')->default(false);
                $table->decimal('peak_hour_surcharge', 10, 2)->default(0);
                $table->decimal('weekend_surcharge', 10, 2)->default(0);
                $table->decimal('holiday_surcharge', 10, 2)->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 4. Delivery Time Slots
        if (!Schema::hasTable('delivery_time_slots')) {
            Schema::create('delivery_time_slots', function (Blueprint $table) {
                $table->id();
                $table->string('slot_code')->unique();
                $table->string('label'); // e.g. "Morning (08:00 - 10:00)"
                $table->time('start_time');
                $table->time('end_time');
                $table->integer('max_capacity')->default(20);
                $table->integer('current_bookings')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 5. Customer Delivery Addresses
        if (!Schema::hasTable('customer_delivery_addresses')) {
            Schema::create('customer_delivery_addresses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
                $table->string('label')->default('Home'); // HOME, OFFICE, STORE, WAREHOUSE, OTHER
                $table->string('recipient_name');
                $table->string('recipient_phone');
                $table->string('province')->default('Phnom Penh');
                $table->string('district')->nullable();
                $table->string('commune')->nullable();
                $table->string('village')->nullable();
                $table->string('street')->nullable();
                $table->string('house_number')->nullable();
                $table->text('full_address');
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->text('landmark')->nullable();
                $table->text('delivery_instructions')->nullable();
                $table->boolean('is_default')->default(false);
                $table->timestamps();
            });
        }

        // 6. Delivery Routes & Stops
        if (!Schema::hasTable('delivery_routes')) {
            Schema::create('delivery_routes', function (Blueprint $table) {
                $table->id();
                $table->string('route_code')->unique();
                $table->foreignId('driver_id')->nullable()->constrained('delivery_drivers')->nullOnDelete();
                $table->foreignId('vehicle_id')->nullable()->constrained('delivery_vehicles')->nullOnDelete();
                $table->string('status')->default('PLANNED'); // PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
                $table->date('route_date');
                $table->decimal('total_distance_km', 8, 2)->default(0);
                $table->integer('estimated_duration_minutes')->default(0);
                $table->integer('total_stops')->default(0);
                $table->integer('completed_stops')->default(0);
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('delivery_route_stops')) {
            Schema::create('delivery_route_stops', function (Blueprint $table) {
                $table->id();
                $table->foreignId('route_id')->constrained('delivery_routes')->cascadeOnDelete();
                $table->foreignId('delivery_id')->constrained('deliveries')->cascadeOnDelete();
                $table->integer('sequence_order')->default(1);
                $table->string('status')->default('PENDING'); // PENDING, ARRIVED, DELIVERED, FAILED, SKIPPED
                $table->string('estimated_arrival_time')->nullable();
                $table->timestamp('actual_arrival_time')->nullable();
                $table->decimal('distance_from_prev_km', 6, 2)->default(0);
                $table->text('stop_notes')->nullable();
                $table->timestamps();
            });
        }

        // 7. Delivery Support Tickets
        if (!Schema::hasTable('delivery_support_tickets')) {
            Schema::create('delivery_support_tickets', function (Blueprint $table) {
                $table->id();
                $table->string('ticket_number')->unique();
                $table->foreignId('delivery_id')->constrained('deliveries')->cascadeOnDelete();
                $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
                $table->foreignId('driver_id')->nullable()->constrained('delivery_drivers')->nullOnDelete();
                $table->string('issue_type'); // LATE_DELIVERY, DAMAGED_PACKAGE, WRONG_ITEMS, PAYMENT_DISPUTE, RIDER_UNREACHABLE, CUSTOMER_UNREACHABLE, OTHER
                $table->string('priority')->default('MEDIUM'); // LOW, MEDIUM, HIGH, URGENT
                $table->text('description');
                $table->string('status')->default('OPEN'); // OPEN, INVESTIGATING, RESOLVED, CLOSED
                $table->text('resolution_notes')->nullable();
                $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('resolved_at')->nullable();
                $table->timestamps();
            });
        }

        // 8. Delivery Ratings
        if (!Schema::hasTable('delivery_ratings')) {
            Schema::create('delivery_ratings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('delivery_id')->constrained('deliveries')->cascadeOnDelete();
                $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
                $table->foreignId('driver_id')->nullable()->constrained('delivery_drivers')->nullOnDelete();
                $table->decimal('overall_rating', 2, 1)->default(5.0);
                $table->decimal('driver_rating', 2, 1)->default(5.0);
                $table->decimal('speed_rating', 2, 1)->default(5.0);
                $table->decimal('communication_rating', 2, 1)->default(5.0);
                $table->decimal('package_rating', 2, 1)->default(5.0);
                $table->text('review_text')->nullable();
                $table->timestamps();
            });
        }

        // 9. Delivery Audit Logs
        if (!Schema::hasTable('delivery_audit_logs')) {
            Schema::create('delivery_audit_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('delivery_id')->constrained('deliveries')->cascadeOnDelete();
                $table->string('actor_name')->default('System');
                $table->string('actor_role')->default('ADMIN');
                $table->string('action'); // REASSIGNED_DRIVER, STATUS_CHANGED, RESCHEDULED, RETURN_INITIATED, SETTLEMENT_CLOSED
                $table->string('old_value')->nullable();
                $table->string('new_value')->nullable();
                $table->string('ip_address')->nullable();
                $table->text('reason')->nullable();
                $table->timestamp('created_at')->useCurrent();
            });
        }

        // 10. Update deliveries table with additional metadata if columns don't exist
        Schema::table('deliveries', function (Blueprint $table) {
            if (!Schema::hasColumn('deliveries', 'time_slot_id')) {
                $table->foreignId('time_slot_id')->nullable()->after('zone_id')->constrained('delivery_time_slots')->nullOnDelete();
            }
            if (!Schema::hasColumn('deliveries', 'vehicle_id')) {
                $table->foreignId('vehicle_id')->nullable()->after('driver_id')->constrained('delivery_vehicles')->nullOnDelete();
            }
            if (!Schema::hasColumn('deliveries', 'route_id')) {
                $table->foreignId('route_id')->nullable()->after('vehicle_id')->constrained('delivery_routes')->nullOnDelete();
            }
            if (!Schema::hasColumn('deliveries', 'weight_kg')) {
                $table->decimal('weight_kg', 8, 2)->default(1.0)->after('priority');
            }
            if (!Schema::hasColumn('deliveries', 'distance_km')) {
                $table->decimal('distance_km', 8, 2)->default(0)->after('weight_kg');
            }
            if (!Schema::hasColumn('deliveries', 'surcharge_amount')) {
                $table->decimal('surcharge_amount', 10, 2)->default(0)->after('delivery_fee');
            }
            if (!Schema::hasColumn('deliveries', 'discount_amount')) {
                $table->decimal('discount_amount', 10, 2)->default(0)->after('surcharge_amount');
            }
            if (!Schema::hasColumn('deliveries', 'arrived_at')) {
                $table->timestamp('arrived_at')->nullable()->after('delivered_at');
            }
            if (!Schema::hasColumn('deliveries', 'completed_at')) {
                $table->timestamp('completed_at')->nullable()->after('arrived_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropForeign(['time_slot_id']);
            $table->dropForeign(['vehicle_id']);
            $table->dropForeign(['route_id']);
            $table->dropColumn([
                'time_slot_id',
                'vehicle_id',
                'route_id',
                'weight_kg',
                'distance_km',
                'surcharge_amount',
                'discount_amount',
                'arrived_at',
                'completed_at',
            ]);
        });

        Schema::dropIfExists('delivery_audit_logs');
        Schema::dropIfExists('delivery_ratings');
        Schema::dropIfExists('delivery_support_tickets');
        Schema::dropIfExists('delivery_route_stops');
        Schema::dropIfExists('delivery_routes');
        Schema::dropIfExists('customer_delivery_addresses');
        Schema::dropIfExists('delivery_time_slots');
        Schema::dropIfExists('delivery_fee_rules');
        Schema::dropIfExists('delivery_vehicle_maintenance');
        Schema::dropIfExists('delivery_vehicles');
    }
};
