import { cachedGet } from "../api/cache";

const REPORT_TTL = 60000;

const getPatients = async (params = {}) => {
    const response = await cachedGet("/reports/patients", { params }, REPORT_TTL);
    return response.data;
};

const getDoctors = async (params = {}) => {
    const response = await cachedGet("/reports/doctors", { params }, REPORT_TTL);
    return response.data;
};

const getAppointments = async (params = {}) => {
    const response = await cachedGet("/reports/appointments", { params }, REPORT_TTL);
    return response.data;
};

const getPayments = async (params = {}) => {
    const response = await cachedGet("/reports/payments", { params }, REPORT_TTL);
    return response.data;
};

const getMedicines = async () => {
    const response = await cachedGet("/reports/medicines", {}, REPORT_TTL);
    return response.data;
};

export default {
    getPatients,
    getDoctors,
    getAppointments,
    getPayments,
    getMedicines,
};
