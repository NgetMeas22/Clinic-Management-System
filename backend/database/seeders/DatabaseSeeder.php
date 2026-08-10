<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;

use App\Models\Role;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {

        $adminRole = Role::create(['name' => 'Admin']);
        $doctorRole = Role::create(['name' => 'Doctor']);
        $receptionistRole = Role::create(['name' => 'Receptionist']);

        // បង្កើត Admin User
        User::create([
            'role_id'  => $adminRole->id,
            'name'     => 'Admin User',
            'email'    => 'admin@clinic.com',
            'password' => Hash::make('password'),
            'status'   => 'active'
        ]);

        // បង្កើត Doctor User
        User::create([
            'role_id'  => $doctorRole->id,
            'name'     => 'Dr. Meas',
            'email'    => 'doctor@clinic.com',
            'password' => Hash::make('password'),
            'status'   => 'active'
        ]);

        // បង្កើត Receptionist User
        User::create([
            'role_id'  => $receptionistRole->id,
            'name'     => 'Receptionist User',
            'email'    => 'receptionist@clinic.com',
            'password' => Hash::make('password'),
            'status'   => 'active'
        ]);

        // Seed at least one patient for API testing
        Patient::create([
            'patient_code' => 'P1001',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'gender' => 'male',
            'date_of_birth' => '1990-01-01',
            'blood_group' => 'O+',
            'phone' => '0123456789',
            'email' => 'john.doe@example.com',
            'address' => 'Sample Address',
            'emergency_contact' => 'Jane Doe',
            'emergency_phone' => '0987654321',
            'status' => 'active',
        ]);


    }
}
