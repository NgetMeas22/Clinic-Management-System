<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;

use App\Models\Department;
use App\Models\Doctor;
use App\Models\Medicine;
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
        User::updateOrCreate(['email' => 'admin@clinic.com'], [
            'role_id'  => $adminRole->id,
            'name'     => 'Admin',
            'password' => Hash::make('admin12345'),
            'status'   => 'active'
        ]);

        // បង្កើត Doctor User
        User::updateOrCreate(['email' => 'doctor@clinic.com'], [
            'role_id'  => $doctorRole->id,
            'name'     => 'Dr.Doctor',
            'password' => Hash::make('doctor12345'),
            'status'   => 'active'
        ]);

        // បង្កើត Receptionist User
        User::updateOrCreate(['email' => 'receptionist@clinic.com'], [
            'role_id'  => $receptionistRole->id,
            'name'     => 'Receptionist User',
            'password' => Hash::make('receptionist12345'),
            'status'   => 'active'
        ]);

        // Seed at least one patient for API testing


        $this->seedDepartments();
        $this->seedDoctorProfiles();
        $this->seedMedicines();
    }

    private function seedDepartments(): void
    {
        $departments = [
            ['name' => 'General Medicine', 'description' => 'Primary healthcare and general checkups'],
            ['name' => 'Pediatrics', 'description' => 'Child healthcare and medical care'],
            ['name' => 'Cardiology', 'description' => 'Heart and cardiovascular care'],
            ['name' => 'Dermatology', 'description' => 'Skin, hair and nail conditions'],
            ['name' => 'Neurology', 'description' => 'Nervous system and brain disorders'],
            ['name' => 'Orthopedics', 'description' => 'Bones, joints and musculoskeletal care'],
            ['name' => 'Gynaecology', 'description' => 'Women\u2019s reproductive health'],
            ['name' => 'Ophthalmology', 'description' => 'Eye examinations and vision care'],
            ['name' => 'ENT (Ear, Nose, Throat)', 'description' => 'Ear, nose and throat conditions'],
            ['name' => 'Dental Care', 'description' => 'Oral health and dental procedures'],
            ['name' => 'Gastroenterology', 'description' => 'Digestive system disorders'],
            ['name' => 'Pulmonology', 'description' => 'Lungs and respiratory conditions'],
            ['name' => 'Psychiatry', 'description' => 'Mental health and counselling'],
            ['name' => 'Urology', 'description' => 'Urinary tract and male reproductive health'],
            ['name' => 'Emergency Medicine', 'description' => 'Urgent and critical care'],
        ];

        foreach ($departments as $department) {
            Department::firstOrCreate(['name' => $department['name']], $department);
        }
    }

    private function seedDoctorProfiles(): void
    {
        $doctorUser = User::where('email', 'doctor@clinic.com')->first();
        $department = Department::where('name', 'General Medicine')->first();

        if ($doctorUser && $department) {
            Doctor::updateOrCreate(['user_id' => $doctorUser->id], [
                'department_id' => $department->id,
                'specialization' => 'General Medicine',
                'license_number' => 'LIC-SEED-001',
                'gender' => 'male',
                'date_of_birth' => '1980-01-01',
                'address' => 'Phnom Penh',
                'status' => 'active',
            ]);
        }
    }

    private function seedMedicines(): void
    {
        $medicines = [
            ['name' => 'Paracetamol 500mg', 'category' => 'Analgesic', 'quantity' => 500, 'unit' => 'tablet', 'price' => 1.5],
            ['name' => 'Amoxicillin 500mg', 'category' => 'Antibiotic', 'quantity' => 250, 'unit' => 'capsule', 'price' => 3.25],
            ['name' => 'Amlodipine 5mg', 'category' => 'Antihypertensive', 'quantity' => 300, 'unit' => 'tablet', 'price' => 2.0],
            ['name' => 'Ibuprofen 400mg', 'category' => 'NSAID', 'quantity' => 400, 'unit' => 'tablet', 'price' => 2.25],
            ['name' => 'Metformin 500mg', 'category' => 'Antidiabetic', 'quantity' => 350, 'unit' => 'tablet', 'price' => 2.75],
            ['name' => 'Omeprazole 20mg', 'category' => 'Antacid', 'quantity' => 200, 'unit' => 'capsule', 'price' => 3.0],
            ['name' => 'Cetirizine 10mg', 'category' => 'Antihistamine', 'quantity' => 300, 'unit' => 'tablet', 'price' => 1.75],
            ['name' => 'Salbutamol Inhaler', 'category' => 'Bronchodilator', 'quantity' => 60, 'unit' => 'inhaler', 'price' => 12.5],
        ];

        foreach ($medicines as $medicine) {
            Medicine::firstOrCreate(['name' => $medicine['name']], $medicine);
        }
    }
}
