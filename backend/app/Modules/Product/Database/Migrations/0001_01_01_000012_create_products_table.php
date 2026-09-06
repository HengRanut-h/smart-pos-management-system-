<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('sku', 100)->unique();
            $table->string('barcode', 100)->nullable()->unique();
            $table->string('name', 255)->index();
            $table->text('description')->nullable();
            $table->string('image_url', 500)->nullable();
            $table->foreignId('category_id')->nullable()->constrained('categories');
            $table->foreignId('brand_id')->nullable()->constrained('brands');
            $table->foreignId('unit_id')->constrained('units');
            $table->decimal('cost_price', 19, 4)->default(0);
            $table->decimal('selling_price', 19, 4)->default(0);
            $table->decimal('tax_rate', 8, 4)->nullable();
            $table->decimal('reorder_level', 19, 4)->nullable();
            $table->decimal('min_stock', 19, 4)->nullable();
            $table->decimal('max_stock', 19, 4)->nullable();
            $table->decimal('weight', 19, 4)->nullable();
            $table->foreignId('status_id')->constrained('sys_statuses');
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void {
        Schema::dropIfExists('products');
    }
};
