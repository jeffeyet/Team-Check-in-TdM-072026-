import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { PASSCODE, IS_PRODUCTION, PASSCODE_CONFIGURED } from "./config";

// Passcode arrives via the "X-Passcode" header (preferred) or a JSON body
// {code} on POST. It is NEVER read from the query string, so it never lands
// in URLs, logs, or browser history.
function readCode(req: Request): string {
  const header = req.header("x-passcode");
  if (header) return header;
  if (req.body && typeof req.body.code !== "undefined") return String(req.body.code);
  return "";
}

// Timing-safe SHA-256 comparison (fixed-length digests, no early return).
export function checkCode(req: Request): boolean {
  const code = readCode(req);
  const given = crypto.createHash("sha256").update(code).digest();
  const expected = crypto.createHash("sha256").update(PASSCODE).digest();
  return crypto.timingSafeEqual(given, expected);
}

// Fail-closed: in production a missing passcode disables admin access entirely.
export function passcodeUnavailable(): boolean {
  return IS_PRODUCTION && !PASSCODE_CONFIGURED;
}

// Middleware for JSON admin routes.
export function requirePasscode(req: Request, res: Response, next: NextFunction) {
  if (passcodeUnavailable()) {
    return res.status(500).json({ error: "Server passcode not configured." });
  }
  if (!checkCode(req)) return res.status(401).json({ error: "Bad passcode." });
  next();
}

// Middleware for CSV/text admin routes (plain-text error bodies).
export function requirePasscodeText(req: Request, res: Response, next: NextFunction) {
  if (passcodeUnavailable()) {
    return res.status(500).send("Server passcode not configured.");
  }
  if (!checkCode(req)) return res.status(401).send("Unauthorized");
  next();
}
