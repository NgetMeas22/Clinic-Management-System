<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Exception;

class MedicineController extends Controller
{
    /**
 * Display a listing of the medicines (with optional search).
 */
public function index(Request $request)
{
    $query = Medicine::query();

    if ($request->has('search')) {
        $search = $request->get('search');
        $query->where('name', 'like', "%{$search}%")
              ->orWhere('category', 'like', "%{$search}%");
    }

    $medicines = $query->get();

    return response()->json([
        'success' => true,
        'data'    => $medicines,
    ]);
}
    /**
     * Store a newly created medicine in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
    'name'        => 'required|string|max:255',
    'category'    => 'required|string|max:255',
    'description' => 'nullable|string',
    'quantity'    => 'required|integer|min:0',
    'unit'        => 'required|string|max:50',
    'price'       => 'required|numeric|min:0',
    'expiry_date' => 'nullable|date',
]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $medicine = Medicine::create($validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Medicine created successfully.',
                'data'    => $medicine,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create medicine.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified medicine.
     */
    public function show(Medicine $medicine)
    {
        return response()->json([
            'success' => true,
            'data'    => $medicine,
        ]);
    }

    /**
     * Update the specified medicine in storage.
     */
    public function update(Request $request, Medicine $medicine)
    {
        $validator = Validator::make($request->all(), [
            'name'        => 'required|string|max:255',
            'category'    => 'required|string|max:255',
            'description' => 'nullable|string',
            'quantity'    => 'required|integer|min:0',
            'price'       => 'required|numeric|min:0',
            'expiry_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $medicine->update($validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Medicine updated successfully.',
                'data'    => $medicine,
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update medicine.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified medicine from storage.
     */
    public function destroy(Medicine $medicine)
    {
        try {
            $medicine->delete();

            return response()->json([
                'success' => true,
                'message' => 'Medicine deleted successfully.',
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete medicine.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
