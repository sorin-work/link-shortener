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

  it('quotes cells with commas, quotes and line breaks', () => {
    expect(toCsv(['ua'], [['Mozilla/5.0 (KHTML, like Gecko)'], ['say "hi"'], ['a\nb']])).toBe(
      'ua\r\n"Mozilla/5.0 (KHTML, like Gecko)"\r\n"say ""hi"""\r\n"a\nb"\r\n',
    );
  });

  it('neutralises spreadsheet formulas', () => {
    expect(toCsv(['ref'], [['=HYPERLINK("http://evil")'], ['-1'], [-1]])).toBe(
      'ref\r\n"\'=HYPERLINK(""http://evil"")"\r\n\'-1\r\n-1\r\n',
    );
  });

  it('writes an empty export as just the header', () => {
    expect(toCsv(['time'], [])).toBe('time\r\n');
  });
});
