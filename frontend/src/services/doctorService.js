import api from './api';
import { cachedGet, invalidateCache } from '../api/cache';

// Get all doctors
export const getDoctors = (params = {}) => {
  return cachedGet('/doctors', { params });
};

// Create new doctor
export const createDoctor = async (doctorData) => {
  const response = await api.post('/doctors', doctorData);
  invalidateCache(['/doctors', '/dashboard']);
  return response;
};

// Update doctor
export const updateDoctor = async (id, doctorData) => {
  const response = await api.put(`/doctors/${id}`, doctorData);
  invalidateCache(['/doctors', '/dashboard']);
  return response;
};

// Delete doctor
export const deleteDoctor = async (id) => {
  const response = await api.delete(`/doctors/${id}`);
  invalidateCache(['/doctors', '/dashboard']);
  return response;
};
