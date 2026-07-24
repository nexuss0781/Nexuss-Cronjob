const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ user: import('../types').User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string, name: string) =>
      request<{ user: import('../types').User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }),
    me: () => request<{ user: import('../types').User }>('/auth/me'),
  },
  monitors: {
    list: () => request<{ monitors: import('../types').Monitor[] }>('/monitors'),
    get: (id: string) => request<{ monitor: import('../types').Monitor }>(`/monitors/${id}`),
    create: (data: {
      name: string;
      url: string;
      method: string;
      interval: number;
      headers?: Record<string, string>;
      body?: string;
    }) =>
      request<{ monitor: import('../types').Monitor }>('/monitors', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request<{ monitor: import('../types').Monitor }>(`/monitors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/monitors/${id}`, { method: 'DELETE' }),
    history: (id: string, limit = 50) =>
      request<{ results: import('../types').CheckResult[] }>(
        `/monitors/${id}/history?limit=${limit}`
      ),
  },
};
