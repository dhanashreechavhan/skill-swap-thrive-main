import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  skills?: string[];
  role?: string;
  isAdmin?: boolean;
  profile?: {
    isBanned?: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const checkAuth = async () => {
    const token = apiService.getToken();
    if (token) {
      try {
        const result = await apiService.getProfile();
        if (result.data) {
          const userData = result.data as User;
          if (userData.profile?.isBanned) {
            apiService.removeToken();
            setUser(null);
            alert('Your account has been banned. Please contact support.');
          } else {
            setUser(userData);
          }
        } else {
          apiService.removeToken();
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    }
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const result = await apiService.login({ email, password });
    setIsLoading(false);

    if (result.data) {
      const userData = (result.data as any).user;
      const newUser = {
        _id: userData.id,
        name: userData.name,
        email: userData.email,
        isAdmin: userData.isAdmin || false,
        profile: {
          isBanned: false,
          profileCompletion: 0
        }
      };
      setUser(newUser);
      return { success: true, needsVerification: true };
    } else {
      return { success: false, error: result.error };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    const result = await apiService.register({ name, email, password });
    setIsLoading(false);

    if (result.data) {
      const userData = (result.data as any).user;
      const newUser = {
        _id: userData.id,
        name: userData.name,
        email: userData.email,
        isAdmin: false,
        profile: {
          profileCompletion: 0
        }
      };
      setUser(newUser);
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
