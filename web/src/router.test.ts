import { afterEach, describe, expect, it, vi } from 'vitest';
import { matchPath, navigate } from './router';

describe('matchPath', () => {
  it('matches static and parameterised segments', () => {
    expect(matchPath('/', '/')).toEqual({});
    expect(matchPath('/links/:id', '/links/42')).toEqual({ id: '42' });
    expect(matchPath('/links/:id', '/links/42/')).toEqual({ id: '42' });
  });

  it('decodes params', () => {
    expect(matchPath('/tag/:name', '/tag/a%20b')).toEqual({ name: 'a b' });
  });

  it('rejects different shapes', () => {
    expect(matchPath('/links/:id', '/links')).toBeNull();
    expect(matchPath('/links/:id', '/keys/42')).toBeNull();
  });
});

describe('navigate', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('pushes under the /app prefix and notifies listeners', () => {
    const listener = vi.fn();
    window.addEventListener('popstate', listener);
    navigate('/links/3');
    expect(window.location.pathname).toBe('/app/links/3');
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener('popstate', listener);
  });
});
