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
        Schema::create('prescription_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('prescription_id')
                ->constrained('prescriptions')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            $table->foreignId('medicine_id')
                ->constrained('medicines')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            $table->unsignedInteger('quantity');

            $table->string('dosage', 100);
            $table->string('frequency', 100);
            $table->string('duration', 100);

            $table->text('instruction')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescription_items');
    }
};
