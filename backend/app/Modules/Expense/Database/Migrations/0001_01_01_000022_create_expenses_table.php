<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('expense_number', 50)->unique();
            $table->foreignId('branch_id')->constrained('branches');
            $table->unsignedBigInteger('expense_category_id')->nullable();
            $table->foreignId('payment_method_id')->nullable()->constrained('payment_methods');
            $table->decimal('amount', 19, 4);
            $table->dateTime('expense_date');
            $table->text('description')->nullable();
            $table->foreignId('status_id')->constrained('sys_statuses');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->dateTime('approved_at')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('expenses');
    }
};
