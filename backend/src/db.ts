import Database from "@replit/database";

// One shared client. Outside Replit (no REPLIT_DB_URL) every KV call fails at
// runtime; that is expected and surfaces as "Save failed." / empty lists.
const client = new Database();

export async function get<T>(key: string): Promise<T | null> {
  return (await client.get(key)) as T | null;
}

export async function set(key: string, value: unknown): Promise<void> {
  await (client.set(key, value) as unknown as Promise<unknown>);
}

export async function list(prefix: string): Promise<string[]> {
  return await client.list(prefix);
}

export async function del(key: string): Promise<void> {
  await (client.delete(key) as unknown as Promise<unknown>);
}
