<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Patient>
 */
class PatientFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'patient_code' => 'P' . $this->faker->unique()->numberBetween(1000, 9999),
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'gender' => $this->faker->randomElement(['male', 'female', 'other']),
            'date_of_birth' => $this->faker->optional()->date(),
            'blood_group' => $this->faker->optional()->randomElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
            'phone' => $this->faker->phoneNumber(),
            'email' => $this->faker->optional()->unique()->safeEmail(),
            'address' => $this->faker->optional()->address(),
            'emergency_contact' => $this->faker->optional()->name(),
            'emergency_phone' => $this->faker->optional()->phoneNumber(),
            'status' => $this->faker->randomElement(['active', 'inactive']),
        ];
    }
}

