import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Subscription, Device, LicenseRecord } from '../types.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  subscription: Subscription | null;
  devices: Device[];
  licenses: LicenseRecord[];
  syncError: string | null;
  isLoading: boolean;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<{ requires2FA?: boolean; message?: string }>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  switchUserRoleDemo: (role: 'customer' | 'admin' | 'guest') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('qbot2_token'));
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUserData = useCallback(async () => {
    const currentToken = localStorage.getItem('qbot2_token');
    if (!currentToken) {
      setUser(null);
      setSubscription(null);
      setDevices([]);
      setLicenses([]);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const resp = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });

      if (resp.ok) {
        const data = await resp.json();
        if (localStorage.getItem('qbot2_token') !== currentToken) return;
        setUser(data.user);
        setSubscription(data.subscription);
        setDevices(data.devices || []);
        setLicenses(data.licenses || []);
        setSyncError(null);
      } else if (resp.status === 401 || resp.status === 403) {
        if (localStorage.getItem('qbot2_token') !== currentToken) return;
        // Token invalid or revoked
        localStorage.removeItem('qbot2_token');
        setToken(null);
        setUser(null);
        setSubscription(null);
        setDevices([]);
        setLicenses([]);
      } else {
        setSyncError('Status could not be refreshed. Check your connection and try again.');
      }
    } catch {
      setSyncError('Status could not be refreshed. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      const storedToken = localStorage.getItem('qbot2_token');
      if (!storedToken) {
        if (mounted) setIsLoading(false);
      } else {
        await refreshUserData();
      }
    };

    initAuth();
    return () => {
      mounted = false;
    };
  }, [refreshUserData]);

  // Live Auto-Sync: Poll every 3 seconds and listen to window focus/visibility events
  // so any admin approvals or subscription state updates instantly reflect on the client
  useEffect(() => {
    if (!token) return;

    // 1. Window focus / visibility change listeners
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshUserData().catch(() => {});
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // 2. Periodic sync timer
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshUserData().catch(() => {});
      }
    }, 3000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      clearInterval(pollInterval);
    };
  }, [token, refreshUserData]);

  const login = async (email: string, password: string, twoFactorCode?: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, twoFactorCode })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to login.');
    }

    if (data.requires2FA) {
      return { requires2FA: true, message: data.message };
    }

    localStorage.setItem('qbot2_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setSubscription(data.subscription);
    setLicenses([]);
    setDevices([]);
    await refreshUserData();
    return {};
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to register.');
    }

    localStorage.setItem('qbot2_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setSubscription(data.subscription);
    setLicenses([]);
    setDevices([]);
    await refreshUserData();
  };

  const logout = () => {
    localStorage.removeItem('qbot2_token');
    setToken(null);
    setUser(null);
    setSubscription(null);
    setDevices([]);
    setLicenses([]);
    setSyncError(null);
  };

  const switchUserRoleDemo = async (role: 'customer' | 'admin' | 'guest') => {
    if (role === 'guest') { logout(); return; }
    throw new Error('Sign in with your own account. Demo accounts are disabled.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        subscription,
        devices,
        licenses,
        syncError,
        isLoading,
        login,
        register,
        logout,
        refreshUserData,
        switchUserRoleDemo
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
