<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Exception;

class PaymentController extends Controller
{
    private function normalizePaymentPayload(array $data): array
    {
        if (isset($data['payment_method'])) {
            $data['payment_method'] = strtolower($data['payment_method']);
        }

        if (isset($data['payment_status'])) {
            $data['payment_status'] = strtolower($data['payment_status']);
        }

        return $data;
    }

    /**
     * GET /api/payments
     */
    public function index(Request $request)
    {
        try {
            $perPage = min(max((int) $request->query('per_page', 10), 1), 200);

            $query = Payment::query()
                ->select([
                    'id', 'patient_id', 'appointment_id', 'amount', 'payment_method',
                    'payment_status', 'transaction_code', 'payment_date', 'notes', 'created_at',
                ])
                ->with([
                    'patient:id,first_name,last_name,patient_code,phone',
                    'appointment:id,patient_id,doctor_id,appointment_date,appointment_time,status',
                    'appointment.doctor:id,user_id,specialization',
                    'appointment.doctor.user:id,name,email,avatar',
                ]);

            if ($request->filled('patient_id')) {
                $query->where(
                    'patient_id',
                    $request->patient_id
                );
            }

            if ($request->filled('appointment_id')) {
                $query->where(
                    'appointment_id',
                    $request->appointment_id
                );
            }

            if ($request->filled('payment_status')) {
                $query->where(
                    'payment_status',
                    $request->payment_status
                );
            }

            if ($request->filled('payment_method')) {
                $query->where(
                    'payment_method',
                    $request->payment_method
                );
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->whereHas('patient', function ($p) use ($search) {
                        $p->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    })->orWhere('transaction_code', 'like', "%{$search}%");

                    if (is_numeric($search)) {
                        $q->orWhere('appointment_id', (int) $search);
                    }
                });
            }

            $payments = $query
                ->latest()
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $payments,
            ]);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payments.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/payments
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'patient_id' => 'required|exists:patients,id',

            'appointment_id' =>
                'required|exists:appointments,id',

            'amount' =>
                'required|numeric|min:0',

            'payment_method' =>
                'required|in:cash,aba,card,Cash,ABA,Card',

            'payment_status' =>
                'required|in:pending,paid,cancelled,Pending,Paid,Cancelled',

            'payment_date' =>
                'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {

            $payment = Payment::create(
                $this->normalizePaymentPayload($validator->validated())
            );

            $payment->load([
                'patient',
                'appointment.doctor.user',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment created successfully.',
                'data' => $payment,
            ], 201);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/payments/{id}
     */
    public function show(Payment $payment)
    {
        try {

            $payment->load([
                'patient',
                'appointment.doctor.user',
            ]);

            return response()->json([
                'success' => true,
                'data' => $payment,
            ]);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payment.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PUT /api/payments/{id}
     */
    public function update(
        Request $request,
        Payment $payment
    ) {
        $validator = Validator::make($request->all(), [
            'patient_id' =>
                'required|exists:patients,id',

            'appointment_id' =>
                'required|exists:appointments,id',

            'amount' =>
                'required|numeric|min:0',

            'payment_method' =>
                'required|in:cash,aba,card,Cash,ABA,Card',

            'payment_status' =>
                'required|in:pending,paid,cancelled,Pending,Paid,Cancelled',

            'payment_date' =>
                'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {

            $payment->update(
                $this->normalizePaymentPayload($validator->validated())
            );

            $payment->load([
                'patient',
                'appointment.doctor.user',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment updated successfully.',
                'data' => $payment,
            ]);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to update payment.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /api/payments/{id}
     */
    public function destroy(Payment $payment)
    {
        try {

            $payment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Payment deleted successfully.',
            ]);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete payment.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
