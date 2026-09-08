<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('telegram_bots', function (Blueprint $table) {
            if (!Schema::hasColumn('telegram_bots', 'attach_backup_file')) {
                $table->boolean('attach_backup_file')->default(true)->after('notify_restore_events');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('telegram_bots', function (Blueprint $table) {
            if (Schema::hasColumn('telegram_bots', 'attach_backup_file')) {
                $table->dropColumn('attach_backup_file');
            }
        });
    }
};
