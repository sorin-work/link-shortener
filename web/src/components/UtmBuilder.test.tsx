import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UtmBuilder } from './UtmBuilder';

afterEach(cleanup);

describe('UtmBuilder', () => {
  it('previews and applies the tagged url', () => {
    const onApply = vi.fn();
    render(<UtmBuilder url="https://shop.example/p?id=4" onApply={onApply} />);
    fireEvent.input(screen.getByPlaceholderText('newsletter'), { target: { value: 'nl' } });
    fireEvent.input(screen.getByPlaceholderText('email'), { target: { value: 'email' } });
    expect(
      screen.getByText('https://shop.example/p?id=4&utm_source=nl&utm_medium=email'),
    ).toBeTruthy();
    fireEvent.click(screen.getByText('Use this URL'));
    expect(onApply).toHaveBeenCalledWith(
      'https://shop.example/p?id=4&utm_source=nl&utm_medium=email',
    );
  });

  it('prefills parameters already in the url', () => {
    render(<UtmBuilder url="https://a.example/?utm_campaign=spring" onApply={() => undefined} />);
    expect((screen.getByPlaceholderText('spring_sale') as HTMLInputElement).value).toBe('spring');
  });
});
