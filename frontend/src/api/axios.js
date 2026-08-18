import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

const currentLocale = () =>
  typeof window !== "undefined" &&
  (window.location.pathname === "/en" ||
    window.location.pathname.startsWith("/en/"))
    ? "en"
    : "km";

const loginPath = () => (currentLocale() === "en" ? "/en/login" : "/login");

axios.defaults.baseURL = API_URL;

axios.interceptors.request.use((config) => {
  config.headers["Accept-Language"] = currentLocale();
  return config;
});

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    config.headers["Accept-Language"] = currentLocale();
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== loginPath()) {
        window.location.href = loginPath();
      }
    }

    if (status === 403) {
      window.dispatchEvent(new CustomEvent("api-forbidden"));
    }

    return Promise.reject(error);
  }
);

export default api;
