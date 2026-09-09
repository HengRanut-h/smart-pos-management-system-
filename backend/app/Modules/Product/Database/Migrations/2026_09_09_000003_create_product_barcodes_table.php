<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_barcodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('barcode', 100)->unique();
            $table->string('barcode_type', 50)->default('EAN_13'); // EAN_13, UPC_A, CODE_128, QR_CODE, SUPPLIER, INTERNAL
            $table->string('package_type', 50)->default('PIECE'); // PIECE, PACK, CARTON, BOX, PALLET, CASE
            $table->integer('multiplier')->default(1);
            $table->decimal('custom_price', 19, 4)->nullable();
            $table->boolean('is_primary')->default(false);
            $table->string('notes', 255)->nullable();
            $table->timestamps();

            $table->index(['product_id', 'package_type']);
            $table->index('barcode');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_barcodes');
    }
};
