import crypto from "crypto";
import { Request } from "express";
import { PASSCODE } from "./config";

export function checkCode(req: Request): boolean {
  const code = (req.query.code || (req.body && req.body.code) || "").toString();
  const given = crypto.createHash("sha256").update(code).digest();
  const expected = crypto.createHash("sha256").update(PASSCODE).digest();
  return crypto.timingSafeEqual(given, expected);
}
