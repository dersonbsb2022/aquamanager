import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AccessToken } from '../types/api.js';
import { setOnSessionExpired } from '../services/api.js';
import { getStoredToken, setSession, type SessionTokens } from '../stores/token.js';

export type AuthContextValue = {
  token: AccessToken | null;
  setSession: (tokens: SessionTokens | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<AccessToken | null>(() => getStoredToken());

  const applySession = useCallback((tokens: SessionTokens | null) => {
    setSession(tokens);
    setTokenState(tokens?.accessToken ?? null);
  }, []);

  const logout = useCallback(() => {
    applySession(null);
  }, [applySession]);

  useEffect(() => {
    setOnSessionExpired(() => {
      applySession(null);
    });
    return () => setOnSessionExpired(null);
  }, [applySession]);

  const value = useMemo(
    () => ({ token, setSession: applySession, logout }),
    [token, applySession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora do AuthProvider');
  return ctx;
}
