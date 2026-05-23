import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import type { Link } from '../types';
import { CreateLinkForm } from './CreateLinkForm';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('CreateLinkForm', () => {
  it('submits only once while the request is pending', async () => {
    let resolve!: (value: { link: Link }) => void;
    const create = vi.spyOn(api, 'createLink').mockReturnValue(new Promise((r) => (resolve = r)));
    const onCreated = vi.fn();
    render(<CreateLinkForm onCreated={onCreated} />);

    fireEvent.input(screen.getByPlaceholderText(/example.com/), {
      target: { value: 'https://example.com' },
    });
    const form = screen.getByRole('button', { name: 'Shorten' }).closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(create).toHaveBeenCalledTimes(1);

    resolve({ link: { id: 1 } as Link });
    await vi.waitFor(() => expect(onCreated).toHaveBeenCalledOnce());
  });

  it('shows field errors from the api', async () => {
    const { ApiError } = await import('../api');
    vi.spyOn(api, 'createLink').mockRejectedValue(
      new ApiError(400, 'Validation failed', 'bad_request', [
        { path: 'slug', message: '"api" is reserved' },
      ]),
    );
    render(<CreateLinkForm onCreated={() => undefined} />);
    fireEvent.submit(screen.getByRole('button', { name: 'Shorten' }).closest('form')!);
    expect(await screen.findByText('"api" is reserved')).toBeTruthy();
  });
});
