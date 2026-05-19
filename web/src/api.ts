import type { ApiKey, FieldError, Link, LinkInput, LinkPage, LinkStats, User } from './types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string,
    public readonly fields: FieldError[] = [],
  ) {
    super(message);
  }

  field(path: string): string | undefined {
    return this.fields.find((f) => f.path === path)?.message;
  }
}

export const errorMessage = (err: unknown) =>
  err instanceof ApiError ? err.message : 'Could not reach the server. Try again.';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = data?.error;
    throw new ApiError(
      res.status,
      error?.message ?? `Request failed (${res.status})`,
      error?.code ?? 'error',
      Array.isArray(error?.details) ? error.details : [],
    );
  }
  return data as T;
}

export function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

export const api = {
  me: () => request<{ user: User }>('GET', '/auth/me'),
  login: (email: string, password: string) =>
    request<{ user: User }>('POST', '/auth/login', { email, password }),
  register: (input: { email: string; name: string; password: string }) =>
    request<{ user: User }>('POST', '/auth/register', input),
  logout: () => request<void>('POST', '/auth/logout'),

  listLinks: (params: { page?: number; q?: string; limit?: number }) =>
    request<LinkPage>('GET', `/links${toQuery(params)}`),
  getLink: (id: number) => request<{ link: Link }>('GET', `/links/${id}`),
  createLink: (input: LinkInput) => request<{ link: Link }>('POST', '/links', input),
  updateLink: (id: number, input: Partial<LinkInput>) =>
    request<{ link: Link }>('PATCH', `/links/${id}`, input),
  deleteLink: (id: number) => request<void>('DELETE', `/links/${id}`),
  listKeys: () => request<{ keys: ApiKey[] }>('GET', '/keys'),
  createKey: (name: string) => request<{ key: ApiKey; token: string }>('POST', '/keys', { name }),
  revokeKey: (id: number) => request<void>('DELETE', `/keys/${id}`),

  getStats: (id: number, days: number, includeBots = false) =>
    request<LinkStats>(
      'GET',
      `/links/${id}/stats${toQuery({ days, bots: includeBots ? 'include' : undefined })}`,
    ),
};
