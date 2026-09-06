<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150)->unique();
            $table->string('code', 100)->unique();
            $table->string('module', 100)->index();
            $table->string('action', 50);
            $table->text('description')->nullable();
            $table->foreignId('status_id')->constrained('sys_statuses');
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('permissions');
    }
};
