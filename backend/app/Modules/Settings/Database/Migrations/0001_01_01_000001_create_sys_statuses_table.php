<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sys_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('domain', 50)->index()->comment('E.g., USER, PRODUCT, SALE');
            $table->string('code', 50);
            $table->string('name', 100);
            $table->string('description', 255)->nullable();
            $table->timestamps();

            $table->unique(['domain', 'code']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('sys_statuses');
    }
};
