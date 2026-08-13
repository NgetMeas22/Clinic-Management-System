<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;

use App\Models\Role;
// use App\Models\Patient;
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

        $adminRole        = Role::firstOrCreate(['name' => 'Admin']);
        $doctorRole       = Role::firstOrCreate(['name' => 'Doctor']);
        $receptionistRole = Role::firstOrCreate(['name' => 'Receptionist']);

        // បង្កើត Admin User
        User::create([
            'role_id'  => $adminRole->id,
            'name'     => 'Admin',
            'email'    => 'admin@clinic.com',
            'password' => Hash::make('admin12345'),
            'status'   => 'active'
        ]);

        // បង្កើត Doctor User
        User::create([
            'role_id'  => $doctorRole->id,
            'name'     => 'Dr.Doctor',
            'email'    => 'doctor@clinic.com',
            'password' => Hash::make('doctor12345'),
            'status'   => 'active'
        ]);

        // បង្កើត Receptionist User
        User::create([
            'role_id'  => $receptionistRole->id,
            'name'     => 'Receptionist User',
            'email'    => 'receptionist@clinic.com',
            'password' => Hash::make('receptionist12345'),
            'status'   => 'active'
        ]);

        // Seed at least one patient for API testing



    }
}
