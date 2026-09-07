<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('provider', 50); // google, telegram
            $table->string('provider_id', 191);
            $table->string('email', 255)->nullable();
            $table->string('nickname', 100)->nullable();
            $table->string('avatar', 500)->nullable();
            $table->text('token')->nullable();
            $table->text('refresh_token')->nullable();
            $table->json('raw_user_data')->nullable();
            $table->timestamps();

            $table->unique(['provider', 'provider_id']);
            $table->index(['user_id', 'provider']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_accounts');
    }
};
