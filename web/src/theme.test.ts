import { afterEach, describe, expect, it } from 'vitest';
import { applyTheme, storedTheme } from './theme';

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('theme', () => {
  it('defaults to the system theme', () => {
    expect(storedTheme()).toBe('system');
  });

  it('remembers an explicit choice and sets data-theme', () => {
    applyTheme('dark');
    expect(storedTheme()).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('goes back to following the system', () => {
    applyTheme('light');
    applyTheme('system');
    expect(storedTheme()).toBe('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});
