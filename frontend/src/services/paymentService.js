import api from './api';

// Helper function to clean & normalize the payload into the exact field
// names the backend validates (payment_date / payment_method / payment_status).
const formatPaymentPayload = (data) => {
    // 1. Amount: strip any $ / currency symbols, then cast to Float
    const cleanAmount = typeof data.amount === 'string'
        ? parseFloat(data.amount.replace(/[^0-9.-]+/g, ''))
        : Number(data.amount);

    // 2. Appointment ID: cast to Number or null when empty
    const appointmentId = data.appointment_id ?? data.appointmentId;
    const cleanAppointmentId = appointmentId && !isNaN(appointmentId)
        ? Number(appointmentId)
        : null;

    // 3. Patient ID: cast to Number or null when empty
    const patientId = data.patient_id ?? data.patientId;
    const cleanPatientId = patientId && !isNaN(patientId)
        ? Number(patientId)
        : null;

    // 4. Date: keep as YYYY-MM-DD (accept both payment_date and date keys)
    let formattedDate = data.payment_date ?? data.date;
    if (formattedDate) {
        const parsedDate = new Date(formattedDate);
        if (!isNaN(parsedDate.getTime())) {
            formattedDate = parsedDate.toISOString().split('T')[0];
        }
    }

    return {
        ...data,
        patient_id: cleanPatientId,
        appointment_id: cleanAppointmentId,
        amount: isNaN(cleanAmount) ? 0 : cleanAmount,
        payment_date: formattedDate,
        payment_method: (data.payment_method ?? data.method ?? 'cash').toLowerCase(),
        payment_status: (data.payment_status ?? data.status ?? 'pending').toLowerCase(),
    };
};

const paymentService = {
    getAll: async (params = {}) => {
        const response = await api.get('/payments', {
            params,
        });

        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(
            `/payments/${id}`
        );

        return response.data;
    },

    create: async (data) => {
        // បំប្លែង Data មុននឹង Send ទៅ Backend
        const payload = formatPaymentPayload(data);

        const response = await api.post(
            '/payments',
            payload
        );

        return response.data;
    },

    update: async (id, data) => {
        // បំប្លែង Data មុននឹង Send ទៅ Backend
        const payload = formatPaymentPayload(data);

        const response = await api.put(
            `/payments/${id}`,
            payload
        );

        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(
            `/payments/${id}`
        );

        return response.data;
    },
};

export default paymentService;