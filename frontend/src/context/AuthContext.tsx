import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { User, UserRole, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, role: UserRole, fullName?: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('recruitai_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('recruitai_access_token');
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const res = await apiClient.get('/me/');
      setUser(res.data);
      localStorage.setItem('recruitai_user', JSON.stringify(res.data));
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiClient.post<AuthResponse>('/auth/login/', { email, password });
    const { user: loggedInUser, tokens } = res.data;

    localStorage.setItem('recruitai_access_token', tokens.access);
    localStorage.setItem('recruitai_refresh_token', tokens.refresh);
    localStorage.setItem('recruitai_user', JSON.stringify(loggedInUser));

    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (email: string, password: string, role: UserRole, fullName?: string): Promise<User> => {
    const res = await apiClient.post<AuthResponse>('/auth/register/', {
      email,
      password,
      role,
      full_name: fullName
    });
    const { user: registeredUser, tokens } = res.data;

    localStorage.setItem('recruitai_access_token', tokens.access);
    localStorage.setItem('recruitai_refresh_token', tokens.refresh);
    localStorage.setItem('recruitai_user', JSON.stringify(registeredUser));

    setUser(registeredUser);
    return registeredUser;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('recruitai_refresh_token');
      await apiClient.post('/auth/logout/', { refresh: refreshToken });
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      localStorage.removeItem('recruitai_access_token');
      localStorage.removeItem('recruitai_refresh_token');
      localStorage.removeItem('recruitai_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
