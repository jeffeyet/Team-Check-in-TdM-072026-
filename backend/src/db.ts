import fs from "fs";
import path from "path";
import Database from "@replit/database";

// Storage abstraction over the Replit key-value database.
//
// - On Replit (REPLIT_DB_URL is set) we use the real KV.
// - Outside Replit (local dev) there is no REPLIT_DB_URL and every real KV call
//   would throw, so we fall back to a small file-backed store on disk. This lets
//   `npm run dev` work fully offline and survive tsx-watch restarts.
//
// The fallback is DEVELOPMENT ONLY: whenever REPLIT_DB_URL exists (i.e. on
// Replit) the real KV is used and this file never touches disk.

interface Store {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  list(prefix: string): Promise<string[]>;
  del(key: string): Promise<void>;
}

// Real Replit KV (production / inside Replit).
function replitStore(): Store {
  const client = new Database();
  return {
    async get<T>(key: string) {
      return (await client.get(key)) as T | null;
    },
    async set(key: string, value: unknown) {
      await (client.set(key, value) as unknown as Promise<unknown>);
    },
    async list(prefix: string) {
      return await client.list(prefix);
    },
    async del(key: string) {
      await (client.delete(key) as unknown as Promise<unknown>);
    },
  };
}

// File-backed in-memory store (local development only).
function devStore(): Store {
  const file = path.resolve(__dirname, "..", ".dev-kv.json");
  const map = new Map<string, unknown>();
  try {
    const obj = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
    for (const [k, v] of Object.entries(obj)) map.set(k, v);
  } catch {
    // No file yet (or unreadable) — start empty.
  }
  const persist = (): void => {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of map) obj[k] = v;
    try {
      fs.writeFileSync(file, JSON.stringify(obj, null, 2));
    } catch {
      // Best-effort in dev.
    }
  };
  // Clone through JSON so callers can't mutate stored values (mirrors the KV,
  // which serializes every value).
  const clone = (v: unknown): unknown => JSON.parse(JSON.stringify(v));
  console.log(
    "[DEV] REPLIT_DB_URL not set — using a local file-backed store " +
      "(" + file + "). This is NOT the Replit KV; deploy on Replit for the real database."
  );
  return {
    async get<T>(key: string) {
      return map.has(key) ? (clone(map.get(key)) as T) : null;
    },
    async set(key: string, value: unknown) {
      map.set(key, clone(value));
      persist();
    },
    async list(prefix: string) {
      return [...map.keys()].filter((k) => k.startsWith(prefix));
    },
    async del(key: string) {
      map.delete(key);
      persist();
    },
  };
}

const store: Store = process.env.REPLIT_DB_URL ? replitStore() : devStore();

export async function get<T>(key: string): Promise<T | null> {
  return store.get<T>(key);
}

export async function set(key: string, value: unknown): Promise<void> {
  return store.set(key, value);
}

export async function list(prefix: string): Promise<string[]> {
  return store.list(prefix);
}

export async function del(key: string): Promise<void> {
  return store.del(key);
}
