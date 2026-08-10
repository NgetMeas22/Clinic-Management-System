<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Appointment;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_code',
        'first_name',
        'last_name',
        'gender',
        'date_of_birth',
        'blood_group',
        'phone',
        'email',
        'address',
        'emergency_contact',
        'emergency_phone',
        'status',
    ];
    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function medicalRecords()
    {
        return $this->hasMany(MedicalRecord::class);
    }

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

}
