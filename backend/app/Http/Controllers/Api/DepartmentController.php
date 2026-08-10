<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;
use Exception;

class DepartmentController extends Controller
{
    /**
     * GET /api/departments
     */
    public function index()
    {
        try {

            $departments = Department::latest()->paginate(10);

            return response()->json([
                'success' => true,
                'message' => 'Departments retrieved successfully',
                'data' => $departments
            ], 200);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve departments',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * POST /api/departments
     */
    public function store(Request $request)
    {
        try {

            $validated = $request->validate([
                'name' => 'required|string|max:100|unique:departments,name',
                'description' => 'nullable|string',
                'status' => 'nullable|in:active,inactive',
            ]);

            $department = Department::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Department created successfully',
                'data' => $department
            ], 201);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to create department',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * GET /api/departments/{id}
     */
    public function show($id)
    {
        try {

            $department = Department::findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Department retrieved successfully',
                'data' => $department
            ], 200);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Department not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }


    /**
     * PUT /api/departments/{id}
     */
    public function update(Request $request, $id)
    {
        try {

            $department = Department::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:100|unique:departments,name,' . $id,
                'description' => 'nullable|string',
                'status' => 'nullable|in:active,inactive',
            ]);

            $department->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Department updated successfully',
                'data' => $department
            ], 200);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to update department',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * DELETE /api/departments/{id}
     */
    public function destroy($id)
    {
        try {

            $department = Department::findOrFail($id);

            $department->delete();

            return response()->json([
                'success' => true,
                'message' => 'Department deleted successfully'
            ], 200);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete department',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
