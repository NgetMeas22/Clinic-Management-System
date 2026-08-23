import api from "./api";
import { cachedGet, invalidateCache } from "../api/cache";

export const getPatients = (params = {}) => {
    return cachedGet("/patients", { params });
};

export const getPatient = (id) => {
    return cachedGet(`/patients/${id}`);
};

export const createPatient = async (data) => {
    const response = await api.post("/patients", data);
    invalidateCache(["/patients", "/dashboard"]);
    return response;
};

export const updatePatient = async (id, data) => {
    const response = await api.put(`/patients/${id}`, data);
    invalidateCache(["/patients", "/dashboard"]);
    return response;
};

export const deletePatient = async (id) => {
    const response = await api.delete(`/patients/${id}`);
    invalidateCache(["/patients", "/dashboard"]);
    return response;
};
