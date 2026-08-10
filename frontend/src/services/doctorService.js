import api from './api';

// Get all doctors
export const getDoctors = async (params = {}) => {
  return await api.get('/doctors', { params }); 
};

// Create new doctor
export const createDoctor = async (doctorData) => {
  return await api.post('/doctors', doctorData); 
};

// Update doctor
export const updateDoctor = async (id, doctorData) => {
  return await api.put(`/doctors/${id}`, doctorData);
};

// Delete doctor
export const deleteDoctor = async (id) => {
  return await api.delete(`/doctors/${id}`);
};