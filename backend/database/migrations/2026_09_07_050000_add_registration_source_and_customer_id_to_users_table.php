<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'customer_id')) {
                $table->foreignId('customer_id')->nullable()->after('employee_id')->constrained('customers')->nullOnDelete();
            }
            if (!Schema::hasColumn('users', 'registration_source')) {
                $table->string('registration_source', 50)->default('system')->after('remember_token')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'registration_source')) {
                $table->dropColumn('registration_source');
            }
            if (Schema::hasColumn('users', 'customer_id')) {
                $table->dropConstrainedForeignId('customer_id');
            }
        });
    }
};
