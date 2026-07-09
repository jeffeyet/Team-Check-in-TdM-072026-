// AI Leadership Intensive - team portal
// Day 1: team check-in.  Day 2: prompt log (Google Doc link + revised idea).
// Data is isolated per cohort (group / edition); admin access is passcode-gated.
import path from "path";
import express from "express";
import { PORT, warnPasscodeAtStartup } from "./config";
import studentRouter from "./routes/student";
import adminRouter from "./routes/admin";

warnPasscodeAtStartup();

const app = express();
app.use(express.json());

// API routes: cohort-scoped student routes and passcode-gated admin routes.
app.use("/api/c", studentRouter);
app.use("/api/admin", adminRouter);

// In production serve the built frontend and fall back to the SPA entry.
const clientDist = path.resolve(__dirname, "../../frontend/dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(Number(PORT), "0.0.0.0", () =>
  console.log("Portal running on port " + PORT)
);
