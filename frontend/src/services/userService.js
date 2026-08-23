import api from "./api";
import { cachedGet, invalidateCache } from "../api/cache";

const userService = {
  getAll: async (params = {}) => {
    const response = await cachedGet("/users", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await cachedGet(`/users/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/users", data);
    invalidateCache(["/users"]);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    invalidateCache(["/users"]);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    invalidateCache(["/users"]);
    return response.data;
  },
};

export default userService;
