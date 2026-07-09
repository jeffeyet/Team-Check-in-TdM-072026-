// Build a CSV line: every field quoted, inner quotes doubled.
export function csvLine(fields: unknown[]): string {
  return fields
    .map((v) => `"${String(v).replace(/"/g, '""')}"`)
    .join(",");
}
