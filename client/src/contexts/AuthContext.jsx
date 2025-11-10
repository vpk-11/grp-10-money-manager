import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');

      // Admin bypass for frontend-only testing
      if (token === 'admin-test-token-12345') {
        const mockUser = JSON.parse(localStorage.getItem('user') || 'null');
        setUser(
          mockUser || {
            name: 'Admin User',
            email: 'admin@test.com',
            _id: 'admin-id-123',
            currency: 'USD',
            timezone: 'UTC',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            isEmailVerified: true,
          }
        );
        return;
      }

      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common.Authorization;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const token = localStorage.getItem('token');
      if (token === 'admin-test-token-12345') {
        const updatedUser = { ...(user || {}), ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true };
      }

      const res = await api.put('/auth/profile', profileData);
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Profile update failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  const value = { user, loading, login, register, logout, updateProfile };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
