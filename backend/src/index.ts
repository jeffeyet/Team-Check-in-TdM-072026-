// AI Leadership Intensive - team portal
// Day 1: team check-in.  Day 2: prompt log (Google Doc link + revised idea).
import path from "path";
import express from "express";
import { PORT } from "./config";
import teamsRouter from "./routes/teams";
import promptsRouter from "./routes/prompts";

const app = express();
app.use(express.json());

// API routes (both routers live under /api).
app.use("/api", teamsRouter);
app.use("/api", promptsRouter);

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
