<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('invoice_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('code', 100)->unique();
            $table->string('document_type', 50)->default('TAX_INVOICE');
            $table->string('paper_size', 30)->default('A4');
            $table->string('orientation', 20)->default('PORTRAIT');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->json('layout_config');
            $table->json('styles_config');
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['document_type', 'is_default']);
            $table->index(['branch_id', 'is_active']);
        });

        Schema::create('invoice_template_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('invoice_templates')->cascadeOnDelete();
            $table->integer('version_number')->default(1);
            $table->string('change_summary', 255)->nullable();
            $table->json('layout_config');
            $table->json('styles_config');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['template_id', 'version_number']);
        });

        Schema::create('invoice_template_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('invoice_templates')->cascadeOnDelete();
            $table->string('document_type', 50);
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->string('pos_terminal_code', 50)->nullable();
            $table->string('sales_channel', 50)->nullable();
            $table->string('customer_group', 50)->nullable();
            $table->integer('priority')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['document_type', 'branch_id', 'is_active']);
        });

        Schema::create('invoice_sequences', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('document_type', 50);
            $table->string('pattern', 100)->default('INV-{YYYY}-{####}');
            $table->string('prefix', 30)->default('INV-');
            $table->string('suffix', 30)->nullable();
            $table->integer('current_number')->default(0);
            $table->integer('padding')->default(4);
            $table->string('reset_frequency', 20)->default('YEARLY');
            $table->date('last_reset_date')->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['document_type', 'branch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_sequences');
        Schema::dropIfExists('invoice_template_assignments');
        Schema::dropIfExists('invoice_template_versions');
        Schema::dropIfExists('invoice_templates');
    }
};
