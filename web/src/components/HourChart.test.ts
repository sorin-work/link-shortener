import { describe, expect, it } from 'vitest';
import { toLocalHours } from './HourChart';

describe('toLocalHours', () => {
  const utc = Array.from({ length: 24 }, (_, h) => h);

  it('keeps utc as is', () => {
    expect(toLocalHours(utc, 0)).toEqual(utc);
  });

  it('shifts east of utc forward', () => {
    // UTC+2: local 02:00 is 00:00 UTC
    const local = toLocalHours(utc, -120);
    expect(local[2]).toBe(0);
    expect(local[0]).toBe(22);
  });

  it('shifts west of utc back', () => {
    // UTC-5: local 19:00 is 00:00 UTC
    expect(toLocalHours(utc, 300)[19]).toBe(0);
  });
});
