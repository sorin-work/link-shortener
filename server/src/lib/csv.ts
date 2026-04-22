export type CsvValue = string | number | boolean | null | undefined;

const cell = (value: CsvValue) => (value === null || value === undefined ? '' : String(value));

/** Renders rows as CSV (RFC 4180 line endings). */
export function toCsv(header: string[], rows: CsvValue[][]): string {
  const line = (values: CsvValue[]) => values.map(cell).join(',');
  return [line(header), ...rows.map(line)].join('\r\n') + '\r\n';
}
