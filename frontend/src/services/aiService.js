import api from './api';

export const askAiAssistant = async (prompt) => {
  const response = await api.post('/ai/ask', { prompt });
  return response.data;
};