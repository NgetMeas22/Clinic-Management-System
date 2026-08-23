import api from "./api";
import { cachedGet, invalidateCache } from "../api/cache";

// GET /api/appointments
export const getAppointments = async (params = {}) => {
    const response = await cachedGet("/appointments", { params });
    return response.data;
};

// GET /api/appointments/{id}
export const getAppointment = async (id) => {
    const response = await cachedGet(`/appointments/${id}`);
    return response.data;
};

// POST /api/appointments
export const createAppointment = async (data) => {
    const response = await api.post("/appointments", data);
    invalidateCache(["/appointments", "/dashboard"]);
    return response.data;
};

// PUT /api/appointments/{id}
export const updateAppointment = async (id, data) => {
    const response = await api.put(`/appointments/${id}`, data);
    invalidateCache(["/appointments", "/dashboard"]);
    return response.data;
};

// DELETE /api/appointments/{id}
export const deleteAppointment = async (id) => {
    const response = await api.delete(`/appointments/${id}`);
    invalidateCache(["/appointments", "/dashboard"]);
    return response.data;
};
