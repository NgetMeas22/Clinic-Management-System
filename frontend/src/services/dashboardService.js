import { cachedGet } from "../api/cache";

const SHORT_TTL = 15000;

const getDashboard = async () => {
    const response = await cachedGet("/dashboard", {}, SHORT_TTL);
    return response.data;
};

const getMonthly = async () => {
    const response = await cachedGet("/dashboard/monthly", {}, SHORT_TTL);
    return response.data;
};

const getWeekly = async () => {
    const response = await cachedGet("/dashboard/weekly", {}, SHORT_TTL);
    return response.data;
};

const getDailyThisMonth = async () => {
    const response = await cachedGet("/dashboard/daily-this-month", {}, SHORT_TTL);
    return response.data;
};

export default {
    getDashboard,
    getMonthly,
    getWeekly,
    getDailyThisMonth,
};
