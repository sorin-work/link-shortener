import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, toQuery } from './api';

afterEach(() => vi.unstubAllGlobals());

const respond = (status: number, body?: unknown) =>
  vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
  );

describe('toQuery', () => {
  it('skips empty values', () => {
    expect(toQuery({ page: 2, q: '', limit: undefined })).toBe('?page=2');
    expect(toQuery({})).toBe('');
  });
});

describe('api client', () => {
  it('returns parsed json', async () => {
    vi.stubGlobal('fetch', respond(200, { user: { id: 1 } }));
    expect(await api.me()).toEqual({ user: { id: 1 } });
  });

  it('throws ApiError with field details', async () => {
    vi.stubGlobal(
      'fetch',
      respond(400, {
        error: {
          code: 'validation_error',
          message: 'Validation failed',
          details: [{ path: 'url', message: 'Bad' }],
        },
      }),
    );
    const err = await api.createLink({ url: 'x' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(400);
    expect((err as ApiError).field('url')).toBe('Bad');
  });

  it('handles empty 204 responses', async () => {
    vi.stubGlobal('fetch', respond(204));
    expect(await api.deleteLink(1)).toBeUndefined();
  });
});
