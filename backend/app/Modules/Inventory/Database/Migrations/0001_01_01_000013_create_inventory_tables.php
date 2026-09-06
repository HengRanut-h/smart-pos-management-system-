<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('product_id')->constrained('products');
            $table->decimal('quantity', 19, 4)->default(0);
            $table->decimal('reserved_quantity', 19, 4)->default(0);
            $table->decimal('available_quantity', 19, 4)->default(0);
            $table->decimal('reorder_level', 19, 4)->nullable();
            $table->dateTime('last_counted_at')->nullable();
            $table->timestamps();

            $table->unique(['warehouse_id', 'product_id']);
        });

        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->string('movement_type', 50)->index();
            $table->decimal('quantity', 19, 4);
            $table->decimal('before_quantity', 19, 4);
            $table->decimal('after_quantity', 19, 4);
            $table->string('reference_type', 100)->nullable()->index();
            $table->unsignedBigInteger('reference_id')->nullable()->index();
            $table->decimal('unit_cost', 19, 4)->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->dateTime('created_at')->index();
        });
    }
    public function down(): void {
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('stocks');
    }
};
