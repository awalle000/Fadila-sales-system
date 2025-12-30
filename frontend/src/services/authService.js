import api from './api';

// ==================== AUTH FUNCTIONS ====================

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    
    // ✅ Backend returns: { id, name, email, role, token, loginLogId }
    const { token, loginLogId, ...user } = response.data;
    
    // Store in sessionStorage for independent tabs
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('loginLogId', loginLogId); // Store for logout
    
    return user;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    const loginLogId = sessionStorage.getItem('loginLogId');
    await api.post('/auth/logout', { loginLogId });
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    // Always clear session data
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('loginLogId');
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('loginLogId');
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ==================== USER MANAGEMENT FUNCTIONS ====================

export const getAllUsers = async () => {
  try {
    const response = await api.get('/auth/users');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/auth/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/auth/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const toggleUserStatus = async (userId) => {
  try {
    const response = await api.patch(`/auth/users/${userId}/toggle-status`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetUserPassword = async (userId, newPassword) => {
  try {
    const response = await api.patch(`/auth/users/${userId}/reset-password`, {
      newPassword
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};