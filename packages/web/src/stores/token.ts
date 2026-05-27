import type { AccessToken } from '../types/api.js';

const ACCESS_KEY = 'aquamanager:access-token';
const REFRESH_KEY = 'aquamanager:refresh-token';

export type SessionTokens = {
  accessToken: AccessToken;
  refreshToken: string;
};

export function getStoredToken(): AccessToken | null {
  const raw = localStorage.getItem(ACCESS_KEY);
  if (!raw) return null;
  return raw as AccessToken;
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setSession(tokens: SessionTokens | null): void {
  if (!tokens) {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    return;
  }
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

/** @deprecated use setSession */
export function setStoredToken(token: AccessToken | null): void {
  if (!token) {
    setSession(null);
    return;
  }
  const refresh = getStoredRefreshToken();
  if (refresh) {
    setSession({ accessToken: token, refreshToken: refresh });
  } else {
    localStorage.setItem(ACCESS_KEY, token);
  }
}

export function clearSession(): void {
  setSession(null);
}
