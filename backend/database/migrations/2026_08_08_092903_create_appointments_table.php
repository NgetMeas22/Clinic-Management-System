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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('patient_id')
                ->constrained('patients')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            $table->foreignId('doctor_id')
                ->constrained('doctors')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            $table->date('appointment_date');
            $table->time('appointment_time');

            $table->text('reason')->nullable();

            $table->enum('status', [
                'pending',
                'confirmed',
                'completed',
                'cancelled'
            ])->default('pending');

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index('appointment_date');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
