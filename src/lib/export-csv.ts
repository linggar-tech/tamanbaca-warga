/**
 * Utilitas Ekspor CSV Aman (Pencegahan Serangan CSV / Formula Injection)
 *
 * Standar Keamanan OWASP & Poin Keamanan 10:
 * Karakter rentan: =, +, -, @, \t, \r
 * Jika sel diawali dengan karakter di atas, spreadsheet (Excel, Google Sheets, LibreOffice)
 * dapat mengeksekusinya sebagai rumus berbahaya seperti DDE command execution (=cmd|' /C ...').
 * Mitigasi: Sel diberi awalan tanda kutip tunggal (') dan dibungkus tanda kutip ganda ("").
 */

export function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // Periksa apakah karakter pertama sel merupakan formula trigger
  const dangerousPrefixes = ["=", "+", "-", "@", "\t", "\r"];
  if (dangerousPrefixes.some((prefix) => str.startsWith(prefix))) {
    // Tambahkan prefix tanda kutip tunggal untuk menetralkan eksekusi formula
    str = `'${str}`;
  }

  // Escape tanda kutip ganda dengan menggandakannya (" -> "")
  const escaped = str.replace(/"/g, '""');

  // Bungkus seluruh konten sel dalam tanda kutip ganda
  return `"${escaped}"`;
}

/**
 * Mengubah array baris dan kolom menjadi format string CSV yang aman.
 */
export function generateSafeCsv(headers: string[], rows: any[][]): string {
  // Sisipkan UTF-8 Byte Order Mark (BOM) agar Excel membaca karakter khusus dengan benar
  const BOM = "\uFEFF";

  const headerLine = headers.map(sanitizeCsvCell).join(",");
  const dataLines = rows
    .map((row) => row.map(sanitizeCsvCell).join(","))
    .join("\r\n");

  return `${BOM}${headerLine}\r\n${dataLines}`;
}
