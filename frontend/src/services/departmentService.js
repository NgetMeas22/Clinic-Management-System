import api from './api';
import { cachedGet, invalidateCache } from '../api/cache';

// Get all departments
export const getDepartments = (params = {}) => {
  return cachedGet('/departments', { params });
};

// Create new department
export const createDepartment = async (departmentData) => {
  const response = await api.post('/departments', departmentData);
  invalidateCache(['/departments', '/dashboard']);
  return response;
};

// Update department
export const updateDepartment = async (id, departmentData) => {
  const response = await api.put(`/departments/${id}`, departmentData);
  invalidateCache(['/departments', '/dashboard']);
  return response;
};

// Delete department
export const deleteDepartment = async (id) => {
  const response = await api.delete(`/departments/${id}`);
  invalidateCache(['/departments', '/dashboard']);
  return response;
};