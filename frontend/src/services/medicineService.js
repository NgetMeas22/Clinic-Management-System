import api from './api';
import { cachedGet, invalidateCache } from '../api/cache';

const medicineService = {
    getAll: async (params = {}) => {
        const response = await cachedGet('/medicines', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await cachedGet(`/medicines/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/medicines', data);
        invalidateCache(['/medicines', '/reports/medicines', '/dashboard']);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/medicines/${id}`, data);
        invalidateCache(['/medicines', '/reports/medicines', '/dashboard']);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/medicines/${id}`);
        invalidateCache(['/medicines', '/reports/medicines', '/dashboard']);
        return response.data;
    },
};

export default medicineService;
