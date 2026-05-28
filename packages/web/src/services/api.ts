import type { ApiErrorBody, ApiSuccess, AccessToken } from '../types/api.js';
import { clearSession, getStoredRefreshToken, getStoredToken, setSession } from '../stores/token.js';

/** Base da API: `/api` com proxy (Vite dev ou nginx em prod). Ou URL absoluta via VITE_API_URL. */
function baseUrl(): string {
  const v = import.meta.env.VITE_API_URL;
  if (typeof v === 'string' && v.length > 0) return v.replace(/\/$/, '');
  return '/api';
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

let onSessionExpired: (() => void) | null = null;

/** Registrado pelo AuthProvider para redirecionar ao login quando a sessão acabar */
export function setOnSessionExpired(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

let refreshInFlight: Promise<AccessToken | null> | null = null;

async function tryRefreshAccessToken(): Promise<AccessToken | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const url = `${baseUrl()}/auth/refresh`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const ct = res.headers.get('Content-Type');
      const isJson = ct?.includes('application/json');
      const body = isJson ? ((await res.json()) as unknown) : null;

      if (!res.ok) {
        clearSession();
        onSessionExpired?.();
        return null;
      }

      const data = (body as ApiSuccess<{ accessToken: string; refreshToken: string }>).data;
      const accessToken = data.accessToken as AccessToken;
      setSession({ accessToken, refreshToken: data.refreshToken });
      return accessToken;
    } catch {
      clearSession();
      onSessionExpired?.();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

type ApiFetchOptions = RequestInit & {
  token?: AccessToken | null;
  /** uso interno — evita loop ao renovar token */
  _retry?: boolean;
};

export async function apiFetch<T>(path: string, init?: ApiFetchOptions): Promise<T> {
  const isAuthRoute =
    path.startsWith('/auth/login') ||
    path.startsWith('/auth/register') ||
    path.startsWith('/auth/refresh');

  const token = init?.token ?? getStoredToken();
  const url = `${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(init?.headers);
  if (init?.body !== undefined && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, { ...init, headers });
  const ct = res.headers.get('Content-Type');
  const isJson = ct?.includes('application/json');
  const body = isJson ? ((await res.json()) as unknown) : null;

  if (!res.ok) {
    const err = body as ApiErrorBody | null;
    const message = err?.error?.message ?? res.statusText;
    const code = err?.error?.code ?? 'UNKNOWN';

    if (
      res.status === 401 &&
      code === 'UNAUTHORIZED' &&
      !init?._retry &&
      !isAuthRoute &&
      getStoredRefreshToken()
    ) {
      const newToken = await tryRefreshAccessToken();
      if (newToken) {
        return apiFetch<T>(path, { ...init, token: newToken, _retry: true });
      }
    }

    if (res.status === 401 && !isAuthRoute) {
      clearSession();
      onSessionExpired?.();
    }

    throw new ApiRequestError(message, res.status, code);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  if (!isJson) {
    return undefined as T;
  }
  return (body as ApiSuccess<T>).data;
}

export async function apiUpload<T>(
  path: string,
  file: File,
  init?: { token?: AccessToken | null },
): Promise<T> {
  const fd = new FormData();
  fd.append('photo', file);
  return apiFetch<T>(path, { method: 'POST', body: fd, token: init?.token });
}
