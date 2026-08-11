import api from "./api";

const getDashboard = async () => {
    const response = await api.get("/dashboard");
    return response.data;
};

const getMonthly = async () => {
    const response = await api.get("/dashboard/monthly");
    return response.data;
};

const getWeekly = async () => {
    const response = await api.get("/dashboard/weekly");
    return response.data;
};

const getDailyThisMonth = async () => {
    const response = await api.get("/dashboard/daily-this-month");
    return response.data;
};

export default {
    getDashboard,
    getMonthly,
    getWeekly,
    getDailyThisMonth,
};
