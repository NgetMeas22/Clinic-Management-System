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
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('patient_id')
                ->constrained('patients')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            $table->foreignId('doctor_id')
                ->constrained('doctors')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            $table->foreignId('medical_record_id')
                ->constrained('medical_records')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            $table->date('prescription_date');

            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
    }
};
