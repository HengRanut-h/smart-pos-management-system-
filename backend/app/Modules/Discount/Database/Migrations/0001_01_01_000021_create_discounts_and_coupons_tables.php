<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('discounts', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->nullable()->unique();
            $table->string('name', 150);
            $table->string('type', 30);
            $table->decimal('value', 19, 4);
            $table->decimal('minimum_amount', 19, 4)->nullable();
            $table->decimal('maximum_discount', 19, 4)->nullable();
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('usage_count')->default(0);
            $table->foreignId('status_id')->constrained('sys_statuses');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code', 100)->unique();
            $table->foreignId('discount_id')->constrained('discounts');
            $table->foreignId('customer_id')->nullable()->constrained('customers');
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('usage_count')->default(0);
            $table->unsignedInteger('per_customer_limit')->nullable();
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->foreignId('status_id')->constrained('sys_statuses');
            $table->timestamps();
        });

        Schema::create('coupon_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coupon_id')->constrained('coupons');
            $table->foreignId('customer_id')->nullable()->constrained('customers');
            $table->foreignId('sale_id')->constrained('sales');
            $table->dateTime('used_at');
        });
    }
    public function down(): void {
        Schema::dropIfExists('coupon_usages');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('discounts');
    }
};
