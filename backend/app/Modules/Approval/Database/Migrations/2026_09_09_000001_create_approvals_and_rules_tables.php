<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Approval Workflows Configuration
        Schema::create('approval_workflows', function (Blueprint $table) {
            $table->id();
            $table->string('code', 100)->unique();
            $table->string('name', 150);
            $table->string('module', 50); // SALES, PURCHASES, INVENTORY, FINANCE, CUSTOMER
            $table->string('description')->nullable();
            $table->string('trigger_event', 100); // HIGH_DISCOUNT, HIGH_REFUND, PURCHASE_ORDER, STOCK_ADJUSTMENT, CREDIT_LIMIT
            $table->decimal('threshold_amount', 19, 4)->default(0);
            $table->string('required_role', 50)->default('BRANCH_MANAGER'); // BRANCH_MANAGER, FINANCE_DIRECTOR, SUPER_ADMIN
            $table->integer('escalation_timeout_hours')->default(24);
            $table->boolean('auto_notify_telegram')->default(true);
            $table->boolean('is_active')->default(true);
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->timestamps();

            $table->index(['module', 'is_active']);
        });

        // 2. Approval Requests (Instances waiting for or completed review)
        Schema::create('approval_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_code', 100)->unique();
            $table->foreignId('workflow_id')->constrained('approval_workflows')->cascadeOnDelete();
            $table->string('requestable_type', 100); // Sale, PurchaseOrder, InventoryMovement, Customer
            $table->unsignedBigInteger('requestable_id')->nullable();
            $table->string('title', 200);
            $table->text('reason')->nullable();
            $table->decimal('amount', 19, 4)->default(0);
            $table->string('currency', 10)->default('USD');
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'ESCALATED'])->default('PENDING');
            $table->json('payload_snapshot')->nullable(); // Original transaction details
            $table->foreignId('requested_by')->constrained('users');
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->text('decision_notes')->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'branch_id']);
            $table->index(['requestable_type', 'requestable_id']);
        });

        // 3. Approval Action History Audit Log
        Schema::create('approval_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('approval_requests')->cascadeOnDelete();
            $table->foreignId('actor_id')->constrained('users');
            $table->enum('action', ['SUBMIT', 'APPROVE', 'REJECT', 'ESCALATE', 'COMMENT']);
            $table->text('comments')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['request_id', 'action']);
        });

        // 4. Enterprise Business Rules Engine
        Schema::create('business_rules', function (Blueprint $table) {
            $table->id();
            $table->string('rule_code', 100)->unique();
            $table->string('name', 150);
            $table->string('domain', 50); // SALES, INVENTORY, PRICING, CUSTOMER, PROCUREMENT
            $table->string('event_hook', 100); // BEFORE_CHECKOUT, STOCK_BELOW_REORDER, REFUND_REQUESTED
            $table->json('condition_expression'); // e.g. {"field": "total_amount", "operator": ">", "value": 500}
            $table->string('action_type', 100); // REQUIRE_APPROVAL, AUTO_DISCOUNT, SEND_ALERT, BLOCK_TRANSACTION
            $table->json('action_payload')->nullable();
            $table->integer('priority')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['domain', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_rules');
        Schema::dropIfExists('approval_actions');
        Schema::dropIfExists('approval_requests');
        Schema::dropIfExists('approval_workflows');
    }
};
