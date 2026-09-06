<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('sale_number', 50)->unique();
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('customer_id')->nullable()->constrained('customers');
            $table->foreignId('cashier_id')->constrained('users');
            $table->dateTime('sale_date');
            $table->decimal('subtotal', 19, 4)->default(0);
            $table->decimal('discount_amount', 19, 4)->default(0);
            $table->decimal('tax_amount', 19, 4)->default(0);
            $table->decimal('shipping_amount', 19, 4)->default(0);
            $table->decimal('total_amount', 19, 4)->default(0);
            $table->decimal('paid_amount', 19, 4)->default(0);
            $table->decimal('change_amount', 19, 4)->default(0);
            $table->foreignId('status_id')->constrained('sys_statuses');
            $table->foreignId('payment_status_id')->constrained('sys_statuses');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('unit_id')->constrained('units');
            $table->decimal('quantity', 19, 4);
            $table->decimal('unit_price', 19, 4);
            $table->decimal('discount_amount', 19, 4)->default(0);
            $table->decimal('tax_rate', 8, 4)->default(0);
            $table->decimal('tax_amount', 19, 4)->default(0);
            $table->decimal('subtotal', 19, 4);
            $table->decimal('total_amount', 19, 4);
            $table->decimal('returned_quantity', 19, 4)->default(0);
            $table->text('notes')->nullable();
        });
    }
    public function down(): void {
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
    }
};
