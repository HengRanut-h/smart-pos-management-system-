<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'attendance_qr_code_id')) {
                $table->foreignId('attendance_qr_code_id')->nullable()->constrained('attendance_qr_codes')->nullOnDelete();
            }
            if (!Schema::hasColumn('attendances', 'type')) {
                $table->string('type', 20)->nullable()->default('check_in'); // check_in, check_out
            }
            if (!Schema::hasColumn('attendances', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable();
            }
            if (!Schema::hasColumn('attendances', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable();
            }
            if (!Schema::hasColumn('attendances', 'ip_address')) {
                $table->string('ip_address', 45)->nullable();
            }
            if (!Schema::hasColumn('attendances', 'device_info')) {
                $table->text('device_info')->nullable();
            }
        });
    }

    public function down(): void {
        Schema::table('attendances', function (Blueprint $table) {
            if (Schema::hasColumn('attendances', 'attendance_qr_code_id')) {
                $table->dropForeign(['attendance_qr_code_id']);
                $table->dropColumn('attendance_qr_code_id');
            }
            $cols = ['type', 'latitude', 'longitude', 'ip_address', 'device_info'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('attendances', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
