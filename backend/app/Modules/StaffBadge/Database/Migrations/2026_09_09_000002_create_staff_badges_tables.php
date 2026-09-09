<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Staff Badge Templates
        Schema::create('staff_badge_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('code', 80)->unique();
            $table->string('badge_type', 50)->default('STAFF'); // STAFF, MANAGER, CASHIER, WAREHOUSE, DRIVER, SECURITY, CONTRACTOR, VISITOR
            $table->string('orientation', 20)->default('VERTICAL'); // VERTICAL (Portrait 54x86), HORIZONTAL (Landscape 86x54)
            $table->string('card_size', 50)->default('CR80_PVC'); // CR80_PVC (85.6x53.98mm), LANYARD_CARD (100x70mm), THERMAL_80
            $table->decimal('width_mm', 8, 2)->default(53.98);
            $table->decimal('height_mm', 8, 2)->default(85.60);
            $table->json('front_design'); // Elements, positions, background colors/gradients, photo shape, logo, borders
            $table->json('back_design')->nullable(); // Return instructions, emergency contact, company policy, secondary barcode
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Staff Badge Template Versions
        Schema::create('staff_badge_template_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('staff_badge_templates')->cascadeOnDelete();
            $table->integer('version_number')->default(1);
            $table->string('change_summary', 255)->nullable();
            $table->json('front_design');
            $table->json('back_design')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });

        // 3. Staff Badges & Cards
        Schema::create('staff_badges', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->foreignId('template_id')->constrained('staff_badge_templates');
            $table->string('badge_number', 80)->unique(); // e.g. BDG-2026-0001
            $table->string('card_number', 80)->unique();  // e.g. CRD-882190
            $table->string('qr_token', 120)->unique();    // Secure opaque token e.g. STF-TK-8f31b8a9...
            $table->string('barcode_value', 80)->nullable(); // Code 128 / Code 39
            $table->string('nfc_uid', 80)->nullable()->unique(); // Physical RFID / NFC hardware UID
            $table->string('status', 30)->default('ACTIVE'); // ACTIVE, INACTIVE, EXPIRED, BLOCKED, LOST, STOLEN, REVOKED, REPLACED
            $table->string('badge_type', 50)->default('STAFF');
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->string('pin_code_hash', 255)->nullable(); // Optional PIN for high-security manager override
            $table->string('reissue_reason', 255)->nullable();
            $table->json('custom_fields')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
            $table->index(['employee_id', 'status']);
            $table->index('qr_token');
            $table->index('nfc_uid');
        });

        // 4. Staff Badge Scan Logs
        Schema::create('staff_badge_scan_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('badge_id')->constrained('staff_badges')->cascadeOnDelete();
            $table->unsignedBigInteger('employee_id');
            $table->string('scan_type', 50)->default('VERIFICATION'); // ATTENDANCE, POS_AUTH, VERIFICATION, STORE_ACCESS
            $table->string('scanner_device', 100)->nullable();
            $table->string('scanner_ip', 60)->nullable();
            $table->string('status', 30)->default('SUCCESS'); // SUCCESS, REJECTED, EXPIRED, BLOCKED
            $table->string('failure_reason', 255)->nullable();
            $table->json('metadata')->nullable(); // Shift info, POS transaction #, override details
            $table->timestamps();

            $table->index(['employee_id', 'scan_type']);
            $table->index('created_at');
        });

        // 5. Staff Badge Audit Logs
        Schema::create('staff_badge_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('badge_id')->constrained('staff_badges')->cascadeOnDelete();
            $table->string('action', 60); // ISSUED, ACTIVATED, BLOCKED, REPORTED_LOST, REPLACED, REVOKED, NFC_BOUND
            $table->unsignedBigInteger('performed_by')->nullable();
            $table->string('old_status', 30)->nullable();
            $table->string('new_status', 30)->nullable();
            $table->text('notes')->nullable();
            $table->string('ip_address', 60)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_badge_audit_logs');
        Schema::dropIfExists('staff_badge_scan_logs');
        Schema::dropIfExists('staff_badges');
        Schema::dropIfExists('staff_badge_template_versions');
        Schema::dropIfExists('staff_badge_templates');
    }
};
