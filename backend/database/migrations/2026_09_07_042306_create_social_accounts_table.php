<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('social_accounts')) {
            Schema::create('social_accounts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('provider', 32);
                $table->string('provider_id', 191);
                $table->string('email', 191)->nullable();
                $table->string('nickname', 191)->nullable();
                $table->text('avatar')->nullable();
                $table->text('token')->nullable();
                $table->text('refresh_token')->nullable();
                $table->json('raw_user_data')->nullable();
                $table->timestamps();

                $table->unique(['provider', 'provider_id']);
                $table->index(['user_id', 'provider']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('social_accounts');
    }
};
