/** Escape a value per RFC 4180: wrap in quotes, double any embedded quotes. */
function escapeCell(value: string | number): string {
  const s = String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

/** Build a CSV string and trigger a browser download of it. */
export function downloadCSV(filename: string, rows: (string | number)[][]): void {
  const csv = rows.map(r => r.map(escapeCell).join(',')).join('\r\n');
  // Leading BOM so Excel opens the file as UTF-8.
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
