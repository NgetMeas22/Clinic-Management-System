import api from "./api";

const getPatients = async (params = {}) => {
    const response = await api.get(
        "/reports/patients",
        { params }
    );

    return response.data;
};

const getDoctors = async (params = {}) => {
    const response = await api.get(
        "/reports/doctors",
        { params }
    );

    return response.data;
};

const getAppointments = async (params = {}) => {
    const response = await api.get(
        "/reports/appointments",
        { params }
    );

    return response.data;
};

const getPayments = async (params = {}) => {
    const response = await api.get(
        "/reports/payments",
        { params }
    );

    return response.data;
};

const getMedicines = async () => {
    const response = await api.get(
        "/reports/medicines"
    );

    return response.data;
};

export default {
    getPatients,
    getDoctors,
    getAppointments,
    getPayments,
    getMedicines,
};