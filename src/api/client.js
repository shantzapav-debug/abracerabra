/**
 * API base URL.
 * Production (VITE_API_URL unset) uses same-origin /api so one Vercel project
 * serves the storefront and the serverless routes.
 * `npm run dev` keeps the local quote API at http://127.0.0.1:8000 unless
 * VITE_API_URL is set, including to an empty string for same-origin.
 */
function resolveApiBase() {
  const configured = import.meta.env.VITE_API_URL;
  if (typeof configured === 'string') {
    return configured.replace(/\/$/, '');
  }
  return import.meta.env.DEV ? 'http://127.0.0.1:8000' : '';
}

const API_URL = resolveApiBase();

export function apiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${normalized}`;
}

/**
 * @param {string} path
 * @param {RequestInit} [options]
 */
export async function apiFetch(path, options = {}) {
  const res = await fetch(apiUrl(path), {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || body;
    } catch {
      /* ignore */
    }
    const err = new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    err.status = res.status;
    err.detail = detail;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export { API_URL };
