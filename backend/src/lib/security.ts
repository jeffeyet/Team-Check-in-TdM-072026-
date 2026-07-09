import { Request, Response, NextFunction } from "express";

// Dependency-free security middleware. RNF-001 caps the backend at two
// production dependencies, so we do NOT pull in Helmet or express-rate-limit;
// these are small hand-rolled equivalents sized for the course. See CC-011.

// ---- Security headers (RNF-014) ----
//
// The CSP allows the one external origin the app actually uses: Google Fonts
// (stylesheet from fonts.googleapis.com, font files from fonts.gstatic.com,
// referenced by frontend/index.html). Inline style attributes (style={{…}} in
// the React views) require 'unsafe-inline' in style-src. Everything else is
// same-origin; the bundled script is served from 'self'.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "img-src 'self' data:",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self'",
  "form-action 'self'",
].join("; ");

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Content-Security-Policy", CSP);
  next();
}

// ---- Rate limiting (RNF-015) ----
//
// Fixed-window counter per client IP, kept in memory. Like withIndexLock
// (CC-008) this is IN-PROCESS only: it does not span multiple instances. At the
// course's scale (one Replit process) it is effective against flooding of the
// public POSTs and brute-forcing the admin passcode. `app.set("trust proxy", 1)`
// (index.ts) makes req.ip the real client behind Replit's proxy.
interface Bucket {
  count: number;
  resetAt: number;
}

const MAX_KEYS = 10000; // bound memory across many distinct IPs

export function rateLimit(opts: { windowMs: number; max: number }) {
  const buckets = new Map<string, Bucket>();

  return function (req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    const key = req.ip || "unknown";

    // Opportunistic cleanup so long-lived processes don't accumulate stale IPs.
    if (buckets.size > MAX_KEYS) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }

    let b = buckets.get(key);
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + opts.windowMs };
      buckets.set(key, b);
    }
    b.count++;

    if (b.count > opts.max) {
      const retryAfter = Math.ceil((b.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(Math.max(retryAfter, 1)));
      return res
        .status(429)
        .json({ error: "Too many requests. Please slow down." });
    }
    next();
  };
}
