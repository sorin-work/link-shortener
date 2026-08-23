import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Link } from '../types';
import { Pagination } from './Pagination';
import { StatusBadges } from './StatusBadge';

afterEach(cleanup);

const link = (overrides: Partial<Link>): Link => ({
  id: 1,
  slug: 'abc',
  shortUrl: 'http://sho.rt/abc',
  url: 'https://example.com/',
  title: null,
  clicks: 0,
  lastClickAt: null,
  expiresAt: null,
  expired: false,
  maxClicks: null,
  clickCount: 0,
  status: 'active',
  hasPassword: false,
  tags: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination page={1} pages={1} onPage={() => undefined} />);
    expect(container.innerHTML).toBe('');
  });

  it('disables previous on the first page and moves forward', () => {
    const onPage = vi.fn();
    render(<Pagination page={1} pages={3} onPage={onPage} />);
    expect((screen.getByText('Previous') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByText('Next'));
    expect(onPage).toHaveBeenCalledWith(2);
    expect(screen.getByText('Page 1 of 3')).toBeTruthy();
  });
});

describe('StatusBadges', () => {
  it.each([
    [{ status: 'paused' as const }, 'Paused'],
    [{ expired: true, status: 'expired' as const }, 'Expired'],
    [{ status: 'limit_reached' as const, maxClicks: 5, clickCount: 5 }, 'Limit reached'],
    [{ maxClicks: 10, clickCount: 3 }, '3/10 clicks'],
    [{ hasPassword: true }, 'Protected'],
  ])('%o shows %s', (overrides, text) => {
    render(<StatusBadges link={link(overrides)} />);
    expect(screen.getByText(text)).toBeTruthy();
  });

  it('shows nothing for a plain link', () => {
    const { container } = render(<StatusBadges link={link({})} />);
    expect(container.textContent).toBe('');
  });
});
