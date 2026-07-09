// Build a CSV line: every field quoted, inner quotes doubled.
//
// CSV formula injection (RNF-013): a value beginning with = + - @ (or a tab /
// carriage return) is treated as a formula by Excel / Google Sheets, so a
// student-supplied team name like "=cmd|..." would execute when the instructor
// opens the export. Quoting alone does not stop it — the spreadsheet still parses
// the cell as a formula. Prefix those values with a single quote so the
// spreadsheet forces them to plain text (the apostrophe is hidden on display).
function neutralizeFormula(s: string): string {
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

export function csvLine(fields: unknown[]): string {
  return fields
    .map((v) => `"${neutralizeFormula(String(v)).replace(/"/g, '""')}"`)
    .join(",");
}
