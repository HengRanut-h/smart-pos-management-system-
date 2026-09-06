<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('branch_id')->default(1)->constrained('branches');
            $table->date('date');
            $table->dateTime('clock_in');
            $table->dateTime('clock_out')->nullable();
            $table->integer('total_minutes')->nullable()->default(0);
            $table->string('status', 30)->default('PRESENT'); // PRESENT, LATE, ON_DUTY, COMPLETED, OVERTIME
            $table->string('scan_method', 30)->default('BARCODE_SCANNER'); // BARCODE_SCANNER, CAMERA, MANUAL
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['employee_id', 'date']);
            $table->index(['date', 'status']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('attendances');
    }
};
