<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'employment_type')) {
                $table->string('employment_type', 30)->default('FULL_TIME'); // FULL_TIME, PART_TIME, CONTRACT
            }
            if (!Schema::hasColumn('employees', 'hourly_rate')) {
                $table->decimal('hourly_rate', 10, 2)->default(3.00);
            }
            if (!Schema::hasColumn('employees', 'ot_hourly_rate')) {
                $table->decimal('ot_hourly_rate', 10, 2)->nullable();
            }
            if (!Schema::hasColumn('employees', 'ot_multiplier')) {
                $table->decimal('ot_multiplier', 4, 2)->default(1.50);
            }
            if (!Schema::hasColumn('employees', 'late_deduction_per_min')) {
                $table->decimal('late_deduction_per_min', 8, 4)->default(0.05);
            }
        });
    }

    public function down(): void {
        Schema::table('employees', function (Blueprint $table) {
            $cols = ['employment_type', 'hourly_rate', 'ot_hourly_rate', 'ot_multiplier', 'late_deduction_per_min'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('employees', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
