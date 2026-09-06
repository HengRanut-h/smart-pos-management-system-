<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name', 100)->unique();
            $table->string('symbol', 20)->nullable();
            $table->unsignedTinyInteger('decimal_places')->default(0);
            $table->foreignId('status_id')->constrained('sys_statuses');
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('units');
    }
};
