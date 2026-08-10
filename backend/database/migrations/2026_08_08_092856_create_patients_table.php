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
        Schema::create('patients', function (Blueprint $table) {
            $table->id();

            $table->string('patient_code', 30)->unique();

            $table->string('first_name', 100);
            $table->string('last_name', 100);

            $table->enum('gender', ['male', 'female', 'other']);

            $table->date('date_of_birth')->nullable();

            $table->string('blood_group', 5)->nullable();

            $table->string('phone', 30)->nullable();
            $table->string('email', 150)->nullable();

            $table->text('address')->nullable();

            $table->string('emergency_contact', 100)->nullable();
            $table->string('emergency_phone', 30)->nullable();

            $table->enum('status', ['active', 'inactive'])
                ->default('active');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
