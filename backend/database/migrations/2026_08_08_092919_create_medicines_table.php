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
        Schema::create('medicines', function (Blueprint $table) {
            $table->id();

            $table->string('name', 150);
            $table->string('category', 100)->nullable();
            $table->text('description')->nullable();

            $table->unsignedInteger('quantity')->default(0);

            $table->string('unit', 30);

            $table->decimal('price', 10, 2)->default(0);

            $table->date('expiry_date')->nullable();

            $table->enum('status', ['active', 'inactive'])
                ->default('active');

            $table->timestamps();

            $table->index('name');
            $table->index('expiry_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medicines');
    }
};
