<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE doctors MODIFY COLUMN status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active'");
    }

    public function down(): void
    {
        // Reverting will fail if any row already has 'on_leave' — clean those up first if you ever roll back
        DB::statement("ALTER TABLE doctors MODIFY COLUMN status ENUM('active', 'inactive') DEFAULT 'active'");
    }
};
