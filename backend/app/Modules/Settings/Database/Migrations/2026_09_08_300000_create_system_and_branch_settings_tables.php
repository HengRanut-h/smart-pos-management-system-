<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Companies Table
        if (!Schema::hasTable('companies')) {
            Schema::create('companies', function (Blueprint $table) {
                $table->id();
                $table->string('name', 150);
                $table->string('code', 50)->unique();
                $table->string('legal_name', 200)->nullable();
                $table->string('tax_id', 100)->nullable();
                $table->string('email', 150)->nullable();
                $table->string('phone', 50)->nullable();
                $table->string('website', 200)->nullable();
                $table->text('address')->nullable();
                $table->string('city', 100)->nullable();
                $table->string('province', 100)->nullable();
                $table->string('country', 100)->default('Cambodia');
                $table->text('logo_url')->nullable();
                $table->text('favicon_url')->nullable();
                $table->string('currency_code', 10)->default('USD');
                $table->string('currency_symbol', 10)->default('$');
                $table->string('timezone', 50)->default('Asia/Phnom_Penh');
                $table->string('fiscal_year_start', 20)->default('01-01');
                $table->foreignId('status_id')->nullable()->default(1);
                $table->timestamps();
            });
        }

        // 2. System Settings Table
        if (!Schema::hasTable('system_settings')) {
            Schema::create('system_settings', function (Blueprint $table) {
                $table->id();
                $table->string('category', 50)->default('general'); // general, localization, financial, inventory, pos, security, notification
                $table->string('key', 100)->unique();
                $table->text('value')->nullable();
                $table->string('value_type', 20)->default('string'); // string, boolean, integer, float, json
                $table->string('description', 255)->nullable();
                $table->boolean('is_public')->default(false);
                $table->timestamps();
            });
        }

        // 3. Enhance Branches Table
        if (Schema::hasTable('branches')) {
            Schema::table('branches', function (Blueprint $table) {
                if (!Schema::hasColumn('branches', 'branch_type')) {
                    $table->string('branch_type', 50)->default('RETAIL_STORE')->after('name'); // HEAD_OFFICE, RETAIL_STORE, WAREHOUSE_HUB, FRANCHISE
                }
                if (!Schema::hasColumn('branches', 'manager_name')) {
                    $table->string('manager_name', 150)->nullable()->after('branch_type');
                }
                if (!Schema::hasColumn('branches', 'manager_phone')) {
                    $table->string('manager_phone', 50)->nullable()->after('manager_name');
                }
                if (!Schema::hasColumn('branches', 'manager_email')) {
                    $table->string('manager_email', 150)->nullable()->after('manager_phone');
                }
                if (!Schema::hasColumn('branches', 'opening_date')) {
                    $table->date('opening_date')->nullable()->after('manager_email');
                }
                if (!Schema::hasColumn('branches', 'logo_url')) {
                    $table->text('logo_url')->nullable()->after('opening_date');
                }
                if (!Schema::hasColumn('branches', 'tax_rate')) {
                    $table->decimal('tax_rate', 5, 2)->default(10.00)->after('logo_url');
                }
                if (!Schema::hasColumn('branches', 'tax_id')) {
                    $table->string('tax_id', 100)->nullable()->after('tax_rate');
                }
                if (!Schema::hasColumn('branches', 'currency_code')) {
                    $table->string('currency_code', 10)->default('USD')->after('tax_id');
                }
                if (!Schema::hasColumn('branches', 'timezone')) {
                    $table->string('timezone', 50)->default('Asia/Phnom_Penh')->after('currency_code');
                }
                if (!Schema::hasColumn('branches', 'default_warehouse_id')) {
                    $table->unsignedBigInteger('default_warehouse_id')->nullable()->after('timezone');
                }
                if (!Schema::hasColumn('branches', 'default_pos_terminal')) {
                    $table->string('default_pos_terminal', 50)->nullable()->after('default_warehouse_id');
                }
                if (!Schema::hasColumn('branches', 'working_hours_summary')) {
                    $table->string('working_hours_summary', 150)->default('Mon-Sun: 07:30 - 21:30')->after('default_pos_terminal');
                }
            });
        }

        // 4. Branch Settings Overrides Table
        if (!Schema::hasTable('branch_settings')) {
            Schema::create('branch_settings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
                $table->string('key', 100);
                $table->text('value')->nullable();
                $table->string('value_type', 20)->default('string');
                $table->timestamps();
                $table->unique(['branch_id', 'key']);
            });
        }

        // 5. Branch Users (Staff assignment)
        if (!Schema::hasTable('branch_users')) {
            Schema::create('branch_users', function (Blueprint $table) {
                $table->id();
                $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('assigned_role', 50)->default('CASHIER'); // ADMIN, MANAGER, CASHIER, WAREHOUSE_STAFF
                $table->unsignedBigInteger('default_terminal_id')->nullable();
                $table->unsignedBigInteger('default_warehouse_id')->nullable();
                $table->json('permissions')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->unique(['branch_id', 'user_id']);
            });
        }

        // 6. Branch POS Terminals
        if (!Schema::hasTable('branch_pos_terminals')) {
            Schema::create('branch_pos_terminals', function (Blueprint $table) {
                $table->id();
                $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
                $table->string('terminal_code', 50);
                $table->string('terminal_name', 100);
                $table->string('ip_address', 50)->nullable();
                $table->string('mac_address', 50)->nullable();
                $table->string('status', 30)->default('ONLINE'); // ONLINE, OFFLINE, STANDBY
                $table->foreignId('assigned_cashier_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('default_printer_name', 100)->nullable();
                $table->boolean('cash_drawer_enabled')->default(true);
                $table->boolean('auto_print')->default(true);
                $table->integer('receipt_copies')->default(1);
                $table->timestamp('last_active_at')->nullable();
                $table->timestamps();
                $table->unique(['branch_id', 'terminal_code']);
            });
        }

        // 7. Branch Printers
        if (!Schema::hasTable('branch_printers')) {
            Schema::create('branch_printers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
                $table->string('printer_name', 100);
                $table->string('printer_type', 50)->default('RECEIPT_80MM'); // RECEIPT_80MM, RECEIPT_58MM, LABEL_BARCODE, A4_INVOICE
                $table->string('connection_type', 30)->default('NETWORK_LAN'); // NETWORK_LAN, USB, BLUETOOTH
                $table->string('ip_address', 50)->nullable();
                $table->integer('port')->default(9100);
                $table->integer('paper_width_mm')->default(80);
                $table->boolean('is_default')->default(false);
                $table->boolean('auto_cut')->default(true);
                $table->boolean('cash_drawer_kick')->default(true);
                $table->string('status', 30)->default('ONLINE');
                $table->timestamps();
            });
        }

        // 8. Branch Number Sequences
        if (!Schema::hasTable('branch_number_sequences')) {
            Schema::create('branch_number_sequences', function (Blueprint $table) {
                $table->id();
                $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
                $table->string('document_type', 50); // INVOICE, RECEIPT, ORDER, PURCHASE, RETURN
                $table->string('prefix', 30)->default('INV-');
                $table->integer('starting_number')->default(1);
                $table->integer('current_number')->default(1);
                $table->integer('zero_padding')->default(6);
                $table->string('date_format_token', 20)->default('YYYY'); // NONE, YYYY, YYYYMM, YYYYMMDD
                $table->string('preview_sample', 100)->nullable();
                $table->timestamps();
                $table->unique(['branch_id', 'document_type']);
            });
        }

        // 9. Branch Business Hours
        if (!Schema::hasTable('branch_business_hours')) {
            Schema::create('branch_business_hours', function (Blueprint $table) {
                $table->id();
                $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
                $table->tinyInteger('day_of_week'); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
                $table->string('day_name', 20);
                $table->boolean('is_open')->default(true);
                $table->string('open_time', 10)->default('07:30');
                $table->string('close_time', 10)->default('21:30');
                $table->string('break_start', 10)->nullable();
                $table->string('break_end', 10)->nullable();
                $table->timestamps();
                $table->unique(['branch_id', 'day_of_week']);
            });
        }

        // 10. Branch Holidays
        if (!Schema::hasTable('branch_holidays')) {
            Schema::create('branch_holidays', function (Blueprint $table) {
                $table->id();
                $table->foreignId('branch_id')->nullable()->constrained('branches')->cascadeOnDelete();
                $table->string('name', 150);
                $table->date('holiday_date');
                $table->boolean('is_closed')->default(false);
                $table->string('note', 255)->nullable();
                $table->timestamps();
            });
        }

        // 11. System Notification Settings
        if (!Schema::hasTable('system_notification_settings')) {
            Schema::create('system_notification_settings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('branch_id')->nullable()->constrained('branches')->cascadeOnDelete();
                $table->string('channel', 30); // EMAIL, TELEGRAM, SMS, PUSH, IN_APP
                $table->string('event_name', 50); // NEW_ORDER, PAYMENT_RECEIVED, LOW_STOCK, OUT_OF_STOCK, FAILED_LOGIN, SUSPICIOUS_LOGIN, BACKUP_COMPLETED, BACKUP_FAILED, SYSTEM_ERROR, NEW_EMPLOYEE, BRANCH_CREATED
                $table->boolean('is_enabled')->default(true);
                $table->string('recipient_target', 150)->nullable();
                $table->timestamps();
            });
        }

        // 12. System Audit Logs (Configuration change audit trail)
        if (!Schema::hasTable('system_audit_logs')) {
            Schema::create('system_audit_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('username', 100)->nullable();
                $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
                $table->string('module', 50)->default('SETTINGS');
                $table->string('setting_key', 100);
                $table->text('old_value')->nullable();
                $table->text('new_value')->nullable();
                $table->string('ip_address', 50)->nullable();
                $table->string('user_agent', 255)->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('system_audit_logs');
        Schema::dropIfExists('system_notification_settings');
        Schema::dropIfExists('branch_holidays');
        Schema::dropIfExists('branch_business_hours');
        Schema::dropIfExists('branch_number_sequences');
        Schema::dropIfExists('branch_printers');
        Schema::dropIfExists('branch_pos_terminals');
        Schema::dropIfExists('branch_users');
        Schema::dropIfExists('branch_settings');
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('companies');
    }
};
