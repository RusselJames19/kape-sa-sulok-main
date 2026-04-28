// CSV export helpers — converts array-of-objects to CSV and triggers browser download.

function escapeCell(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Convert an array of plain objects to a CSV string.
 * @param {Array<Object>} rows
 * @param {Array<{key: string, label: string}>} columns
 */
export function toCsv(rows, columns) {
  const header = columns.map((c) => escapeCell(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCell(row[c.key])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

/**
 * Trigger a CSV file download in the browser.
 * @param {string} filename
 * @param {string} csv
 */
export function downloadCsv(filename, csv) {
  // BOM so Excel recognises UTF-8.
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
