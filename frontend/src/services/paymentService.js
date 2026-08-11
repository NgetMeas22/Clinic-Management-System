import api from './api';

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
        const response = await api.post(
            '/payments',
            data
        );

        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(
            `/payments/${id}`,
            data
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