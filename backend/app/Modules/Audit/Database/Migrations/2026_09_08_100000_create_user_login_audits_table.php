<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_login_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('username', 100)->index();
            $table->string('session_id', 150)->nullable()->index();
            $table->string('event_type', 50)->default('LOGIN')->index(); // LOGIN, LOGOUT, LOCK, UNLOCK, 2FA
            $table->string('status', 30)->default('SUCCESS')->index(); // SUCCESS, FAILED, BLOCKED, SUSPICIOUS
            $table->string('ip_address', 45)->nullable()->index();
            $table->text('user_agent')->nullable();
            $table->string('device_type', 30)->default('DESKTOP'); // DESKTOP, MOBILE, TABLET, UNKNOWN
            $table->string('browser', 50)->nullable();
            $table->string('operating_system', 50)->nullable();
            $table->string('country', 100)->default('Cambodia');
            $table->string('city', 100)->default('Phnom Penh');
            $table->string('authentication_method', 50)->default('PASSWORD'); // PASSWORD, PIN, OTP, BIOMETRIC, GOOGLE, TELEGRAM
            $table->string('failure_reason', 255)->nullable();
            $table->boolean('is_suspicious')->default(false)->index();
            $table->boolean('remember_me')->default(false);
            $table->boolean('two_factor_verified')->default(false);
            $table->dateTime('login_at')->nullable();
            $table->dateTime('logout_at')->nullable();
            $table->dateTime('last_activity_at')->nullable();
            $table->string('logout_reason', 50)->nullable(); // MANUAL, TIMEOUT, ADMIN_FORCED
            $table->timestamps();

            $table->index(['created_at', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_login_audits');
    }
};
