<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->string('type', 50); // CASH, KHQR, CARD, BANK_TRANSFER, etc.
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_number', 50)->unique();
            $table->foreignId('sale_id')->nullable()->constrained('sales');
            $table->foreignId('purchase_id')->nullable()->constrained('purchases');
            $table->foreignId('customer_id')->nullable()->constrained('customers');
            $table->foreignId('payment_method_id')->constrained('payment_methods');
            $table->decimal('amount', 19, 4);
            $table->char('currency', 3)->default('USD');
            $table->decimal('exchange_rate', 19, 8)->default(1);
            $table->string('reference_number', 150)->nullable()->index();
            $table->string('transaction_id', 150)->nullable()->unique();
            $table->foreignId('status_id')->constrained('sys_statuses');
            $table->dateTime('paid_at');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('payment_methods');
    }
};
