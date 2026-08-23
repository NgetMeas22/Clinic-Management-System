import api from './api';
import { cachedGet, invalidateCache } from '../api/cache';

const medicalRecordService = {

    getAll: async (params = {}) => {
        const response = await cachedGet('/medical-records', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await cachedGet(`/medical-records/${id}`);
        return response.data;
    },

    getByPatient: async (patientId) => {
        const response = await cachedGet('/medical-records', {
            params: { patient_id: patientId },
        });
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/medical-records', data);
        invalidateCache(['/medical-records', '/dashboard']);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/medical-records/${id}`, data);
        invalidateCache(['/medical-records', '/dashboard']);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/medical-records/${id}`);
        invalidateCache(['/medical-records', '/dashboard']);
        return response.data;
    },
};

export default medicalRecordService;