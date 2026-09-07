<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('otp_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('purpose', 50); // REGISTRATION, PASSWORD_RESET, PHONE_LOGIN
            $table->string('channel', 20)->default('EMAIL'); // EMAIL, SMS
            $table->string('destination', 150); // Email address or Phone number
            $table->string('otp_hash', 255); // Hashed OTP - never plain text!
            $table->timestamp('expires_at');
            $table->integer('attempts')->default(0); // Max attempts (e.g. 5)
            $table->integer('resend_count')->default(0); // Max resends (e.g. 3)
            $table->timestamp('cooldown_until')->nullable(); // 60s cooldown
            $table->timestamp('verified_at')->nullable();
            $table->string('reset_token_hash', 255)->nullable(); // Short-lived reset token hash
            $table->timestamp('reset_token_expires_at')->nullable();
            $table->timestamps();

            $table->index(['purpose', 'destination']);
            $table->index(['user_id', 'purpose']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_verifications');
    }
};
