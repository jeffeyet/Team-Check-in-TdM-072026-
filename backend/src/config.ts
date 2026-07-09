// Instructor passcode. In production it MUST be provided via the PASSCODE
// secret (Replit: Tools > Secrets). In development we fall back to a default
// and warn loudly. See auth.ts for the fail-closed behavior in production.
const rawPasscode = process.env.PASSCODE;

export const IS_PRODUCTION =
  process.env.NODE_ENV === "production" || !!process.env.REPLIT_DEPLOYMENT;

export const PASSCODE_CONFIGURED =
  typeof rawPasscode === "string" && rawPasscode.length > 0;

// Effective passcode used for comparison. In production without a configured
// passcode this default is never actually reachable (admin routes fail closed
// with 500), but we keep a stable value so the timing-safe compare still runs.
export const PASSCODE = PASSCODE_CONFIGURED ? (rawPasscode as string) : "roster2026";

export const PORT = process.env.PORT || 3000;

// Emit a clear startup warning about the passcode posture.
export function warnPasscodeAtStartup(): void {
  if (IS_PRODUCTION && !PASSCODE_CONFIGURED) {
    console.warn(
      "[SECURITY] PASSCODE is not set in production. Admin routes will respond " +
        "500 \"Server passcode not configured.\" until you set the PASSCODE secret."
    );
  } else if (!PASSCODE_CONFIGURED) {
    console.warn(
      '[SECURITY] PASSCODE not set; using development default "roster2026". ' +
        "Do not run in production without setting the PASSCODE secret."
    );
  }
}
