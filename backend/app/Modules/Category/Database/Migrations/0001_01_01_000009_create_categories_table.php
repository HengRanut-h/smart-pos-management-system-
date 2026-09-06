<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('categories');
            $table->string('code', 50)->unique();
            $table->string('name', 150)->index();
            $table->text('description')->nullable();
            $table->string('image_path', 500)->nullable();
            $table->integer('sort_order')->default(0);
            $table->foreignId('status_id')->constrained('sys_statuses');
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void {
        Schema::dropIfExists('categories');
    }
};
