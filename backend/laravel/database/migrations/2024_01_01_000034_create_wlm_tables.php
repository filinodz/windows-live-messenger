<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Comptes du messager (indépendants de Supabase, stockés en MySQL).
        Schema::create('wlm_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('password');
            $table->string('display_name', 50);
            $table->string('personal_message', 160)->default('');
            $table->string('avatar_url')->nullable();
            $table->string('status', 20)->default('Available'); // Available/Busy/Away/Offline
            $table->timestamp('last_seen')->nullable();
            $table->string('api_token', 80)->nullable()->index();
            $table->timestamps();
        });

        Schema::create('wlm_friendships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requester_id')->constrained('wlm_profiles')->cascadeOnDelete();
            $table->foreignId('addressee_id')->constrained('wlm_profiles')->cascadeOnDelete();
            $table->string('status', 20)->default('pending'); // pending/accepted
            $table->boolean('is_favorite')->default(false);
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
            $table->unique(['requester_id', 'addressee_id']);
        });

        Schema::create('wlm_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('wlm_profiles')->cascadeOnDelete();
            $table->foreignId('recipient_id')->constrained('wlm_profiles')->cascadeOnDelete();
            $table->text('content');
            $table->string('kind', 10)->default('text'); // text/nudge
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['sender_id', 'recipient_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wlm_messages');
        Schema::dropIfExists('wlm_friendships');
        Schema::dropIfExists('wlm_profiles');
    }
};
