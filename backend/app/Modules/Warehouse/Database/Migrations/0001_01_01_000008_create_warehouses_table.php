<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches');
            $table->string('code', 50)->unique();
            $table->string('name', 150);
            $table->string('type', 50);
            $table->text('address')->nullable();
            $table->foreignId('manager_id')->nullable()->constrained('employees');
            $table->foreignId('status_id')->constrained('sys_statuses');
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void {
        Schema::dropIfExists('warehouses');
    }
};
