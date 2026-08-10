import api from "./api";

export const getPatients = (params = {}) => {
    return api.get("/patients", {
        params,
    });
};

export const getPatient = (id) => {
    return api.get(`/patients/${id}`);
};

export const createPatient = (data) => {
    return api.post("/patients", data);
};

export const updatePatient = (id, data) => {
    return api.put(`/patients/${id}`, data);
};

export const deletePatient = (id) => {
    return api.delete(`/patients/${id}`);
};