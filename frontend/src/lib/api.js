import { useAuthStore } from '../store/authStore';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

// Local promise tracking to prevent redundant /auth/me calls
let _userFetchPromise = null;

/**
 * Fetch the current authenticated user from the server.
 * Uses the HttpOnly accessToken cookie — no localStorage reads.
 * Returns null if unauthenticated.
 */
export async function getCurrentUser() {
  const store = useAuthStore.getState();
  if (store.user) return store.user;
  if (store.isFetching) return _userFetchPromise;

  store.setFetching(true);
  _userFetchPromise = fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
    .then(async (res) => {
      if (!res.ok) { store.setUser(null); return null; }
      const json = await res.json();
      const userData = json?.data ?? json;
      store.setUser(userData);
      return userData;
    })
    .catch(() => { store.setUser(null); return null; })
    .finally(() => { store.setFetching(false); });

  return _userFetchPromise;
}

export function clearUserCache() {
  useAuthStore.getState().logout();
}

import toast from 'react-hot-toast';

/**
 * Reads the csrf-token cookie set by the server CsrfMiddleware.
 * Returns undefined if not present (e.g. on initial page load before first GET).
 */
function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Main API fetch wrapper.
 * - Sends credentials (cookies) automatically on every request.
 * - Injects x-csrf-token header on mutating requests (POST/PUT/PATCH/DELETE).
 * - Handles 401 by redirecting to /login.
 * - Shows an error toast if the request fails with 5xx or 4xx (except 401).
 * - Returns raw Response for callers to .json() themselves.
 */
export async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const method = (options.method ?? 'GET').toUpperCase();
  const isMutating = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  const csrfToken = isMutating ? getCsrfToken() : undefined;

  try {
    const res = await fetch(url, {
      ...options,
      credentials: 'include',  // Send HttpOnly cookies on every request
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        ...(options.headers ?? {}),
      },
    });

    // Handle auth expiry — clear user cache and redirect to login
    if (res.status === 401) {
      clearUserCache();
      window.location.href = '/login';
      return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    }

    if (!res.ok) {
      // Graceful error reporting for Enterprise hospitals
      toast.error(`System Notice: Request failed (${res.status})`, {
        icon: '⚠️',
        style: { borderRadius: '12px', background: '#334155', color: '#fff' }
      });
    }

    return res;
  } catch (err) {
    toast.error('Network Error: Cannot reach clinical services.', {
      icon: '🏥',
      style: { borderRadius: '12px', background: '#334155', color: '#fff' }
    });
    throw err;
  }
}

/**
 * Standardized fetch for paginated endpoints.
 * Returns { data, meta } instead of just an array.
 */
export async function paginatedFetch(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  const res = await apiRequest(path + '?' + url.searchParams.toString(), {
    method: 'GET'
  });

  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

/** Legacy support: many components expect just data[]. */
export const wrapPaginated = (json) => {
  if (json?.data && json?.meta) return json.data;
  return json;
};

/** Convenience methods */
export const api = {
  get:    (path)        => apiRequest(path, { method: 'GET' }),
  post:   (path, body)  => apiRequest(path, { method: 'POST',  body: body !== undefined ? JSON.stringify(body) : undefined }),
  put:    (path, body)  => apiRequest(path, { method: 'PUT',   body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch:  (path, body)  => apiRequest(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: (path)        => apiRequest(path, { method: 'DELETE' }),
};
