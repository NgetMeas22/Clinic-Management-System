import api from './api';

const prescriptionService = {

    getAll: async (params = {}) => {
        const response = await api.get('/prescriptions', {
            params,
        });

        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(
            `/prescriptions/${id}`
        );

        return response.data;
    },

    create: async (data) => {
        const response = await api.post(
            '/prescriptions',
            data
        );

        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(
            `/prescriptions/${id}`,
            data
        );

        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(
            `/prescriptions/${id}`
        );

        return response.data;
    },
};

export default prescriptionService;