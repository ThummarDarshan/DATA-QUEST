import React, { useEffect, useState, createContext, useContext } from 'react';
import { authApi, apiClient, User } from '../services/api';

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for saved user and token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('user_data');
      
      if (token && savedUser) {
        try {
          // Set token in API client
          apiClient.setToken(token);
          
          // Verify token is still valid by fetching current user
          const response = await authApi.getCurrentUser();
          if (response.success && response.data) {
            // Backend returns { data: { user: ..., unreadNotifications: ... } }
            const userData = response.data.user;
            setUser(userData);
            localStorage.setItem('user_data', JSON.stringify(userData));
          } else {
            // Token is invalid, clear everything
            clearAuthData();
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          clearAuthData();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const clearAuthData = () => {
    setUser(null);
    apiClient.setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const response = await authApi.login({ email, password });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        apiClient.setToken(response.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: response.message || 'Login failed' };
      }
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const response = await authApi.register({ name, email, password });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        apiClient.setToken(response.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: response.message || 'Registration failed' };
      }
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    clearAuthData();
  };

  const updateUser = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.updateProfile(updates);
      
      if (response.success && response.data) {
        // Backend returns { data: { user: ... } }
        const updatedUser = response.data.user || response.data;
        setUser(updatedUser);
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        return { success: true };
      } else {
        return { success: false, error: response.message || 'Update failed' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed';
      return { success: false, error: errorMessage };
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        // Backend returns { data: { user: ..., unreadNotifications: ... } }
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('user_data', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};