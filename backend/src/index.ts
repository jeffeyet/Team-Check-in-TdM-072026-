// AI Leadership Intensive - team portal
// Day 1: team check-in.  Day 2: prompt log (Google Doc link + revised idea).
// Data is isolated per cohort (group / edition); admin access is passcode-gated.
import path from "path";
import express, { NextFunction, Request, Response } from "express";
import { PORT, warnPasscodeAtStartup } from "./config";
import { securityHeaders, rateLimit } from "./lib/security";
import studentRouter from "./routes/student";
import adminRouter from "./routes/admin";

warnPasscodeAtStartup();

const app = express();
// Behind Replit's proxy, trust the first hop so req.ip is the real client IP
// (used by the rate limiter). See CC-011 / RNF-015.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(securityHeaders);
// Explicit body-size cap so a large payload can't grow the parser (RNF-004/014).
app.use(express.json({ limit: "100kb" }));

// API routes: cohort-scoped student routes and passcode-gated admin routes.
// The admin limiter throttles brute-forcing the passcode; it is generous enough
// never to bother a single instructor's dashboard use (RNF-015).
const adminLimiter = rateLimit({ windowMs: 60_000, max: 100 });
app.use("/api/c", studentRouter);
app.use("/api/admin", adminLimiter, adminRouter);

// In production serve the built frontend and fall back to the SPA entry.
const clientDist = path.resolve(__dirname, "../../frontend/dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDist, "index.html"));
});

// Final error handler: catches body-parser failures (malformed JSON, oversized
// body) that throw BEFORE a route's try/catch, and any other unhandled error.
// Never leaks a stack trace to the client (RNF-010/CC-011).
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;
  const e = err as { type?: string; status?: number };
  if (e && e.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed request body." });
  }
  if (e && e.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body too large." });
  }
  console.error("[ERROR]", err);
  res.status(500).json({ error: "Server error." });
});

app.listen(Number(PORT), "0.0.0.0", () =>
  console.log("Portal running on port " + PORT)
);
