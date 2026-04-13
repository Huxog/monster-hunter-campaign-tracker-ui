const getBaseUrl = () => import.meta.env.VITE_API_BASE_URL ?? '';

// Lazy import to avoid circular dependency — auth store imports apiClient,
// apiClient reads token from auth store at call time, not at module load time.
function getToken(): string | null {
  // Dynamic require-style access avoids a static circular import.
  // The auth store is a singleton; reading its state here is safe.
  return (
    (
      window.__mhAuthStore as
        | { getState: () => { token: string | null } }
        | undefined
    )?.getState().token ?? null
  );
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${getBaseUrl()}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Clear auth state — the router's beforeLoad guards will redirect to /login.
    (
      window.__mhAuthStore as
        | { getState: () => { clearAuth: () => void } }
        | undefined
    )
      ?.getState()
      .clearAuth();
    throw new ApiError(401, 'Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      (body as { message?: string }).message ?? res.statusText,
      body,
    );
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// The auth store registers itself here after creation so the API client can
// read the token without a static circular import.
declare global {
  interface Window {
    __mhAuthStore?: {
      getState: () => { token: string | null; clearAuth: () => void };
    };
  }
}
