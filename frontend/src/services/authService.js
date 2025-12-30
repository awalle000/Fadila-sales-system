import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data));
    localStorage.setItem('loginLogId', response.data.loginLogId);
  }
  return response.data;
};

export const logout = async () => {
  const loginLogId = localStorage.getItem('loginLogId');
  try {
    await api.post('/auth/logout', { loginLogId });
  } catch (error) {
    console.error('Logout error:', error);
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('loginLogId');
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get('/auth/users');
  return response.data;
};

export const updateUser = async (userId, userData) => {
  const response = await api.put(`/auth/users/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/auth/users/${userId}`);
  return response.data;
};

export const toggleUserStatus = async (userId) => {
  const response = await api.put(`/auth/users/${userId}/toggle-status`);
  return response.data;
};