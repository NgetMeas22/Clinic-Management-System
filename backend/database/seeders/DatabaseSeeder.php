<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Doctor;
use App\Models\Medicine;
use App\Models\Role;
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

        // 1. System Admin User
        User::updateOrCreate(
            ['email' => 'admin@clinic.com'],
            [
                'role_id'  => $adminRole->id,
                'name'     => 'System Admin',
                'password' => Hash::make('admin12345'),
                'phone'    => '012111222',
                'status'   => 'active',
            ]
        );

        // 2. Doctor User
        User::updateOrCreate(
            ['email' => 'sarah.connor@clinic.com'],
            [
                'role_id'  => $doctorRole->id,
                'name'     => 'Dr. Sarah Connor',
                'password' => Hash::make('doctor12345'),
                'phone'    => '012333444',
                'status'   => 'active',
            ]
        );

        // 3. Receptionist User
        User::updateOrCreate(
            ['email' => 'emily.watson@clinic.com'],
            [
                'role_id'  => $receptionistRole->id,
                'name'     => 'Emily Watson',
                'password' => Hash::make('receptionist12345'),
                'phone'    => '012777888',
                'status'   => 'active',
            ]
        );

        // Run sub-seeders
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
            ['name' => 'Gynaecology', 'description' => "Women's reproductive health"],
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
        $doctorUser = User::where('email', 'sarah.connor@clinic.com')->first();
        $department = Department::where('name', 'General Medicine')->first();

        if ($doctorUser && $department) {
            Doctor::updateOrCreate(
                ['license_number' => 'LIC-SEED-001'], // ប្រើ license_number ជា Key ដើម្បីការពារ Duplicate Error
                [
                    'user_id'        => $doctorUser->id,
                    'department_id'  => $department->id,
                    'specialization' => 'General Medicine',
                    'gender'         => 'female',
                    'date_of_birth'  => '1985-05-15',
                    'address'        => 'Phnom Penh',
                    'status'         => 'active',
                ]
            );
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
