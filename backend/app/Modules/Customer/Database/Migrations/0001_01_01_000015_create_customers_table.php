<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('customer_code', 50)->unique();
            $table->string('name', 255)->index();
            $table->string('phone', 30)->nullable()->index();
            $table->string('email', 255)->nullable()->index();
            $table->unsignedBigInteger('customer_group_id')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 20)->nullable();
            $table->text('address')->nullable();
            $table->decimal('loyalty_points', 19, 4)->default(0);
            $table->decimal('credit_limit', 19, 4)->nullable();
            $table->foreignId('status_id')->constrained('sys_statuses');
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void {
        Schema::dropIfExists('customers');
    }
};
