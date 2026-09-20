import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Subscription, Device } from '../types.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  subscription: Subscription | null;
  devices: Device[];
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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUserData = useCallback(async () => {
    const currentToken = localStorage.getItem('qbot2_token');
    if (!currentToken) {
      setUser(null);
      setSubscription(null);
      setDevices([]);
      setIsLoading(false);
      return;
    }

    try {
      const resp = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });

      if (resp.ok) {
        const data = await resp.json();
        setUser(data.user);
        setSubscription(data.subscription);

        // Fetch devices
        const devResp = await fetch('/api/devices', {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        if (devResp.ok) {
          const devData = await devResp.json();
          setDevices(devData.devices || []);
        }
      } else {
        // Token invalid
        localStorage.removeItem('qbot2_token');
        setToken(null);
        setUser(null);
        setSubscription(null);
      }
    } catch (err) {
      console.error('Failed to fetch user state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // If no token exists on first load, seed with demo customer for rich out-of-the-box exploration
    const storedToken = localStorage.getItem('qbot2_token');
    if (!storedToken) {
      // Auto-login to demo customer to show dashboard instantly
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'trader@algotrders.site', password: 'password123' })
      })
        .then(r => r.json())
        .then(data => {
          if (data.token) {
            localStorage.setItem('qbot2_token', data.token);
            setToken(data.token);
            setUser(data.user);
            setSubscription(data.subscription);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      refreshUserData();
    }
  }, [refreshUserData]);

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
    await refreshUserData();
  };

  const logout = () => {
    localStorage.removeItem('qbot2_token');
    setToken(null);
    setUser(null);
    setSubscription(null);
    setDevices([]);
  };

  const switchUserRoleDemo = async (role: 'customer' | 'admin' | 'guest') => {
    if (role === 'guest') {
      logout();
      return;
    }
    const email = role === 'admin' ? 'admin@algotrders.site' : 'trader@algotrders.site';
    await login(email, 'password123', role === 'admin' ? '123456' : undefined);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        subscription,
        devices,
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
