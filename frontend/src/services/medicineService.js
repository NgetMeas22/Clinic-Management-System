import api from './api';

const medicineService = {
    getAll: async (params = {}) => {
        const response = await api.get('/medicines', {
            params,
        });

        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(
            `/medicines/${id}`
        );

        return response.data;
    },

    create: async (data) => {
        const response = await api.post(
            '/medicines',
            data
        );

        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(
            `/medicines/${id}`,
            data
        );

        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(
            `/medicines/${id}`
        );

        return response.data;
    },
};

export default medicineService;