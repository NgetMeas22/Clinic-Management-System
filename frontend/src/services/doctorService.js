import api from './api';
import { cachedGet, invalidateCache } from '../api/cache';

const isFormData = (data) => typeof FormData !== "undefined" && data instanceof FormData;

const formDataConfig = {
  headers: { "Content-Type": "multipart/form-data" },
};

export const getDoctors = (params = {}) => {
  return cachedGet('/doctors', { params });
};

export const createDoctor = async (doctorData) => {
  const response = await api.post(
    '/doctors',
    doctorData,
    isFormData(doctorData) ? formDataConfig : undefined
  );
  invalidateCache(['/doctors', '/dashboard']);
  return response;
};

export const updateDoctor = async (id, doctorData) => {
  if (isFormData(doctorData)) {
    doctorData.append("_method", "PUT");
    const response = await api.post(`/doctors/${id}`, doctorData, formDataConfig);
    invalidateCache(['/doctors', '/dashboard']);
    return response;
  }

  const response = await api.put(`/doctors/${id}`, doctorData);
  invalidateCache(['/doctors', '/dashboard']);
  return response;
};

export const deleteDoctor = async (id) => {
  const response = await api.delete(`/doctors/${id}`);
  invalidateCache(['/doctors', '/dashboard']);
  return response;
};
