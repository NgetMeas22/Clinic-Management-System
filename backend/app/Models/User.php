<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'role_id',
        'name',
        'email',
        'password',
        'phone',
        'profile_picture',
        'status',
        'google_id', // 👈 បានបន្ថែម
        'avatar',    // 👈 បានបន្ថែម
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
    ];

    protected $appends = [
        'avatar_url',
    ];

    /**
     * Relationships
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function doctor()
    {
        return $this->hasOne(Doctor::class);
    }

    /**
     * Accessor សម្រាប់ទាញយក URL រូបភាព (ទ្រទ្រង់ទាំង Google Avatar និង Local Storage)
     */
    public function getAvatarUrlAttribute(): ?string
    {
        if ($this->avatar) {
            return $this->avatar;
        }

        return $this->profile_picture
            ? asset('storage/' . $this->profile_picture)
            : null;
    }
}
