<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. registers
        Schema::create('registers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->string('status', 30)->default('ACTIVE'); // ACTIVE, INACTIVE
            $table->timestamps();
        });

        // 2. shifts
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('register_id')->constrained('registers');
            $table->foreignId('cashier_id')->constrained('users');
            $table->string('shift_number', 50)->unique();
            $table->dateTime('opened_at');
            $table->dateTime('closed_at')->nullable();
            $table->decimal('opening_cash', 19, 4)->default(0);
            $table->decimal('expected_cash', 19, 4)->nullable();
            $table->decimal('actual_cash', 19, 4)->nullable();
            $table->decimal('cash_difference', 19, 4)->nullable();
            $table->string('status', 30)->default('OPEN'); // OPEN, CLOSED
            $table->foreignId('closed_by')->nullable()->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 3. cash_drawers
        Schema::create('cash_drawers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('register_id')->constrained('registers');
            $table->foreignId('shift_id')->nullable()->constrained('shifts');
            $table->decimal('opening_balance', 19, 4)->default(0);
            $table->decimal('current_balance', 19, 4)->default(0);
            $table->string('status', 30)->default('CLOSED'); // OPEN, CLOSED
            $table->dateTime('opened_at')->nullable();
            $table->dateTime('closed_at')->nullable();
            $table->timestamps();
        });

        // 4. cash_movements
        Schema::create('cash_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shift_id')->constrained('shifts')->cascadeOnDelete();
            $table->foreignId('register_id')->constrained('registers');
            $table->foreignId('cashier_id')->constrained('users');
            $table->string('type', 30)->index(); // CASH_IN, CASH_OUT, SAFE_DROP, EXPENSE
            $table->decimal('amount', 19, 4);
            $table->string('reason', 255);
            $table->string('reference_type', 50)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->dateTime('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_movements');
        Schema::dropIfExists('cash_drawers');
        Schema::dropIfExists('shifts');
        Schema::dropIfExists('registers');
    }
};
