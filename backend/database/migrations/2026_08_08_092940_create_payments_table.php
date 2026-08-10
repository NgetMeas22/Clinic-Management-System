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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('patient_id')
                ->constrained('patients')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            $table->foreignId('appointment_id')
                ->constrained('appointments')
                ->restrictOnDelete()
                ->cascadeOnUpdate();

            $table->decimal('amount', 10, 2)->default(0);

            $table->enum('payment_method', [
                'cash',
                'aba',
                'card'
            ]);

            $table->enum('payment_status', [
                'pending',
                'paid',
                'cancelled'
            ])->default('pending');

            $table->string('transaction_code', 100)
                ->nullable()
                ->unique();

            $table->dateTime('payment_date')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
