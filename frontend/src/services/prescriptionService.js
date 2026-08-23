import api from './api';
import { cachedGet, invalidateCache } from '../api/cache';

const prescriptionService = {

    getAll: async (params = {}) => {
        const response = await cachedGet('/prescriptions', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await cachedGet(`/prescriptions/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/prescriptions', data);
        invalidateCache(['/prescriptions', '/dashboard']);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/prescriptions/${id}`, data);
        invalidateCache(['/prescriptions', '/dashboard']);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/prescriptions/${id}`);
        invalidateCache(['/prescriptions', '/dashboard']);
        return response.data;
    },
};

export default prescriptionService;