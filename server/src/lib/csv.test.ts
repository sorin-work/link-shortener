import { describe, expect, it } from 'vitest';
import { toCsv } from './csv.js';

describe('toCsv', () => {
  it('writes a header and rows with crlf line endings', () => {
    expect(
      toCsv(
        ['a', 'b'],
        [
          [1, 'x'],
          [2, null],
        ],
      ),
    ).toBe('a,b\r\n1,x\r\n2,\r\n');
  });

  it('writes an empty export as just the header', () => {
    expect(toCsv(['time'], [])).toBe('time\r\n');
  });
});
