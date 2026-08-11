<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
   public function rules(): array
{
    return [
        'first_name' => [
            'required',
            'string',
            'max:100'
        ],

        'last_name' => [
            'required',
            'string',
            'max:100'
        ],

        'gender' => [
            'required',
            'in:Male,Female,Other'
        ],

        'phone' => [
            'required',
            'string',
            'max:20'
        ],

        'email' => [
            'nullable',
            'email',
            'max:100'
        ],

        'date_of_birth' => [
            'nullable',
            'date'
        ],
    ];
}
}
