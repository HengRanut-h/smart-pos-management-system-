<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('attendance_qr_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('branches')->cascadeOnDelete();
            $table->string('qr_token', 120)->unique();
            $table->string('name', 150)->default('Main Entrance Storefront QR');
            $table->string('status', 30)->default('ACTIVE'); // ACTIVE, INACTIVE, EXPIRED
            $table->dateTime('expires_at')->nullable();
            $table->timestamps();

            $table->index(['store_id', 'status']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('attendance_qr_codes');
    }
};
