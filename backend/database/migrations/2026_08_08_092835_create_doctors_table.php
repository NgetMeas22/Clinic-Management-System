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
        Schema::create('doctors', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            $table->foreignId('department_id')
                ->constrained('departments')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            $table->string('specialization', 150);
            $table->string('license_number', 100)->unique();

            $table->enum('gender', ['male', 'female', 'other']);

            $table->date('date_of_birth')->nullable();
            $table->text('address')->nullable();

            $table->enum('status', ['active', 'inactive'])
                ->default('active');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctors');
    }
};
