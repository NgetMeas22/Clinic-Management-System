import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// បន្ថែម Interceptor ដើម្បីផ្ញើ Bearer Token គ្រប់ Request ទាំងអស់
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // ឬប្រអប់រក្សាទុក Token របស់អ្នក (ឧ. 'access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;