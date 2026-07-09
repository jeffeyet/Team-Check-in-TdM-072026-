import { Response } from "express";

export function badPasscode(res: Response) {
  return res.status(401).json({ error: "Bad passcode." });
}

export function unauthorizedText(res: Response) {
  return res.status(401).send("Unauthorized");
}
