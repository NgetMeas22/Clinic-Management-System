import api from "./api";

// GET /api/appointments
export const getAppointments = async (params = {}) => {
    const response = await api.get("/appointments", {
        params,
    });

    return response.data;
};

// GET /api/appointments/{id}
export const getAppointment = async (id) => {
    const response = await api.get(`/appointments/${id}`);

    return response.data;
};

// POST /api/appointments
export const createAppointment = async (data) => {
    const response = await api.post("/appointments", data);

    return response.data;
};

// PUT /api/appointments/{id}
export const updateAppointment = async (id, data) => {
    const response = await api.put(`/appointments/${id}`, data);

    return response.data;
};

// DELETE /api/appointments/{id}
export const deleteAppointment = async (id) => {
    const response = await api.delete(`/appointments/${id}`);

    return response.data;
};