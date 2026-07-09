// Input validation helpers.
//
// URLs are the sensitive case: a stored `javascript:`/`data:` link rendered in
// an <a href> on the instructor dashboard would run in the instructor's session
// (which holds the passcode). React does NOT sanitize href, so we constrain
// user-provided links to http(s) at the server. See CC-011 / RNF-012.

// True only for well-formed absolute http:// or https:// URLs.
export function isHttpUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const s = value.trim();
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// Returns the trimmed URL if it is http(s), else "" (drops unsafe/blank links).
export function sanitizeHttpUrl(value: unknown): string {
  return isHttpUrl(value) ? String(value).trim() : "";
}
