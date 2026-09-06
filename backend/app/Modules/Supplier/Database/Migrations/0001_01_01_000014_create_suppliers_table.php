<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 255)->index();
            $table->string('contact_person', 150)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email', 255)->nullable();
            $table->string('tax_number', 100)->nullable()->unique();
            $table->text('address')->nullable();
            $table->string('payment_terms', 100)->nullable();
            $table->decimal('credit_limit', 19, 4)->nullable();
            $table->foreignId('status_id')->constrained('sys_statuses');
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void {
        Schema::dropIfExists('suppliers');
    }
};
