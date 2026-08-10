<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    use HasFactory;

   protected $fillable = [
    'name',
    'category',
    'description',
    'quantity',
    'unit',
    'price',
    'expiry_date',
];

    protected $casts = [
        'price' => 'decimal:2',
        'expiry_date' => 'date',
    ];

    public function prescriptionItems()
    {
        return $this->hasMany(PrescriptionItem::class);
    }
}
