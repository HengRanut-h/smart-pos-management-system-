<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Backup Records Table
        if (!Schema::hasTable('backup_records')) {
            Schema::create('backup_records', function (Blueprint $table) {
                $table->id();
                $table->string('backup_code', 50)->unique();
                $table->string('backup_type', 40)->default('FULL'); // FULL, DIFFERENTIAL, SETTINGS_ONLY, DATABASE_UPLOADS
                $table->string('filename', 255);
                $table->string('file_path', 500);
                $table->unsignedBigInteger('size_bytes')->default(0);
                $table->string('size_formatted', 30)->default('0 KB');
                $table->string('checksum_sha256', 64)->nullable();
                $table->boolean('is_compressed')->default(true);
                $table->boolean('is_encrypted')->default(false);
                $table->boolean('is_verified')->default(true);
                $table->string('storage_destinations', 100)->default('LOCAL'); // LOCAL, CLOUD, EXTERNAL, LOCAL+CLOUD
                $table->string('status', 30)->default('SUCCESS'); // SUCCESS, FAILED, IN_PROGRESS, CORRUPTED
                $table->text('error_message')->nullable();
                $table->unsignedInteger('duration_seconds')->default(0);
                $table->unsignedInteger('retention_days')->default(30);
                $table->dateTime('expires_at')->nullable();
                $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('created_by_type', 30)->default('MANUAL'); // MANUAL, SCHEDULED, TELEGRAM_BOT
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index(['created_at', 'status']);
            });
        }

        // 2. Backup Schedules Table
        if (!Schema::hasTable('backup_schedules')) {
            Schema::create('backup_schedules', function (Blueprint $table) {
                $table->id();
                $table->string('name', 100);
                $table->string('frequency', 30)->default('DAILY'); // DAILY, WEEKLY, MONTHLY, PRE_MIGRATION
                $table->time('start_time')->default('02:00:00');
                $table->unsignedTinyInteger('day_of_week')->nullable(); // 0=Sunday..6=Saturday
                $table->unsignedTinyInteger('day_of_month')->nullable(); // 1..31
                $table->string('backup_type', 40)->default('FULL');
                $table->string('storage_destination', 50)->default('LOCAL');
                $table->unsignedInteger('retention_days')->default(30);
                $table->boolean('is_compressed')->default(true);
                $table->boolean('is_encrypted')->default(false);
                $table->boolean('notify_on_success')->default(true);
                $table->boolean('notify_on_failure')->default(true);
                $table->dateTime('last_run_at')->nullable();
                $table->dateTime('next_run_at')->nullable();
                $table->string('status', 20)->default('ACTIVE'); // ACTIVE, PAUSED
                $table->timestamps();
            });
        }

        // 3. Telegram Bots Configuration Table
        if (!Schema::hasTable('telegram_bots')) {
            Schema::create('telegram_bots', function (Blueprint $table) {
                $table->id();
                $table->string('name', 100)->default('SmartPOS Backup Alert Bot');
                $table->string('bot_username', 100)->default('@SmartPOS_AlertBot');
                $table->string('bot_token', 255)->nullable();
                $table->string('status', 20)->default('ACTIVE'); // ACTIVE, INACTIVE
                $table->string('webhook_url', 255)->nullable();
                $table->boolean('notify_backup_success')->default(true);
                $table->boolean('notify_backup_failed')->default(true);
                $table->boolean('notify_storage_warning')->default(true);
                $table->boolean('notify_security_alerts')->default(true);
                $table->boolean('notify_restore_events')->default(true);
                $table->timestamps();
            });
        }

        // 4. Telegram Authorized Users Table
        if (!Schema::hasTable('telegram_users')) {
            Schema::create('telegram_users', function (Blueprint $table) {
                $table->id();
                $table->string('telegram_chat_id', 50)->index();
                $table->string('telegram_username', 100)->nullable();
                $table->string('first_name', 100)->nullable();
                $table->string('last_name', 100)->nullable();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->boolean('is_authorized')->default(true);
                $table->string('role', 50)->default('SUPER_ADMIN');
                $table->json('allowed_commands')->nullable();
                $table->timestamps();
            });
        }

        // 5. Telegram Audit Logs Table
        if (!Schema::hasTable('telegram_logs')) {
            Schema::create('telegram_logs', function (Blueprint $table) {
                $table->id();
                $table->string('telegram_chat_id', 50)->nullable()->index();
                $table->string('telegram_username', 100)->nullable();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('command', 50)->nullable();
                $table->string('action', 50)->default('COMMAND'); // COMMAND, NOTIFICATION, ALERT
                $table->string('status', 30)->default('SUCCESS'); // SUCCESS, DENIED, FAILED
                $table->json('request_payload')->nullable();
                $table->text('response_text')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('telegram_logs');
        Schema::dropIfExists('telegram_users');
        Schema::dropIfExists('telegram_bots');
        Schema::dropIfExists('backup_schedules');
        Schema::dropIfExists('backup_records');
    }
};
