export type CsvValue = string | number | boolean | null | undefined;

function cell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  // Referrers and user agents are visitor-controlled; don't let them become formulas.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Renders rows as CSV (RFC 4180 line endings). */
export function toCsv(header: string[], rows: CsvValue[][]): string {
  const line = (values: CsvValue[]) => values.map(cell).join(',');
  return [line(header), ...rows.map(line)].join('\r\n') + '\r\n';
}
