import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SafeUser, Student, Employee, UserRole } from '../types/index.js';
import { api } from '../services/api.js';
import { APP_CONFIG } from '../config/index.js';

interface AuthContextType {
  user: SafeUser | null;
  profile: Student | Employee | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  demoMode: boolean;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  registerAndClaim: (data: {
    profileId: string;
    dateOfBirth: string;
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [profile, setProfile] = useState<Student | Employee | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(APP_CONFIG.DEMO_MODE);
  const [loading, setLoading] = useState<boolean>(true);

  const reloadUser = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      setProfile(res.profile);
      setDemoMode(res.demoMode);
    } catch {
      api.setAuth(null, null);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadUser();
  }, [reloadUser]);

  // Tab/Window close session handling using sendBeacon as required by Section 6
  useEffect(() => {
    const handleBeforeUnload = () => {
      api.closeSessionBeacon();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, []);

  const login = async (identifier: string, password: string): Promise<void> => {
    const res = await api.login(identifier, password);
    setUser(res.user);
    await reloadUser();
  };

  const logout = async (): Promise<void> => {
    await api.logout();
    setUser(null);
    setProfile(null);
  };

  const registerAndClaim = async (data: {
    profileId: string;
    dateOfBirth: string;
    username: string;
    email: string;
    password: string;
  }): Promise<void> => {
    const res = await api.register(data);
    setUser(res.user);
    await reloadUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: user?.role || null,
        isAuthenticated: Boolean(user),
        demoMode,
        loading,
        login,
        logout,
        registerAndClaim,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
