<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('returns', function (Blueprint $table) {
            $table->id();
            $table->string('return_number', 50)->unique();
            $table->foreignId('sale_id')->constrained('sales');
            $table->foreignId('customer_id')->nullable()->constrained('customers');
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->dateTime('return_date');
            $table->unsignedBigInteger('reason_id')->nullable();
            $table->decimal('subtotal', 19, 4)->default(0);
            $table->decimal('refund_amount', 19, 4)->default(0);
            $table->foreignId('status_id')->constrained('sys_statuses');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->dateTime('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('return_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('return_id')->constrained('returns')->onDelete('cascade');
            $table->foreignId('sale_item_id')->constrained('sale_items');
            $table->foreignId('product_id')->constrained('products');
            $table->decimal('quantity', 19, 4);
            $table->decimal('unit_price', 19, 4);
            $table->decimal('refund_amount', 19, 4);
            $table->unsignedBigInteger('condition_id')->nullable();
            $table->boolean('restockable')->default(true);
            $table->text('notes')->nullable();
        });
    }
    public function down(): void {
        Schema::dropIfExists('return_items');
        Schema::dropIfExists('returns');
    }
};
