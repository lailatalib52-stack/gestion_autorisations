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
        // Utilisation d'une requête brute (raw query) pour modifier l'enum sans avoir besoin de doctrine/dbal
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE demandes MODIFY statut ENUM('en_attente', 'validee_manager', 'refusee_manager', 'acceptee', 'refusee') DEFAULT 'en_attente'");
    }

    public function down(): void
    {
        // Revert to original statuses (only if data allows, otherwise this might fail if a new status exists)
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE demandes MODIFY statut ENUM('en_attente', 'acceptee', 'refusee') DEFAULT 'en_attente'");
    }
};
