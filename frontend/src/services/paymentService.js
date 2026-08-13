import api from './api';

// Helper function សម្រាប់សម្អាត និងបំប្លែងទិន្នន័យឱ្យត្រូវ Data Type
const formatPaymentPayload = (data) => {
    // 1. បំប្លែង Amount: លុបសញ្ញា $ ឬអក្សរចេញ ទុកតែលេខ ហើយបំប្លែងទៅជា Float
    const cleanAmount = typeof data.amount === 'string'
        ? parseFloat(data.amount.replace(/[^0-9.-]+/g, ''))
        : Number(data.amount);

    // 2. បំប្លែង Appointment ID: បំប្លែងទៅជា Number ឬ null (បើគ្មាន ឬជា string ទទេ)
    const appointmentId = data.appointment_id || data.appointmentId;
    const cleanAppointmentId = appointmentId && !isNaN(appointmentId)
        ? Number(appointmentId)
        : null;

    // 3. បំប្លែង Date: បំប្លែងទៅជា ISO String (YYYY-MM-DD)
    let formattedDate = data.date;
    if (data.date) {
        const parsedDate = new Date(data.date);
        if (!isNaN(parsedDate.getTime())) {
            formattedDate = parsedDate.toISOString().split('T')[0];
        }
    }

    return {
        ...data,
        appointment_id: cleanAppointmentId,
        amount: isNaN(cleanAmount) ? 0 : cleanAmount,
        date: formattedDate,
        method: data.method?.toLowerCase() || 'cash',
        status: data.status?.toLowerCase() || 'pending',
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