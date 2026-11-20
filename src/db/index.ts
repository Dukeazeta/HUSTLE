import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { isDemoMode } from "@/lib/demo";

export function isDatabaseConfigured() {
  if (isDemoMode()) return false;

  const url = process.env.TURSO_CONNECTION_URL;
  return Boolean(
    url && (url.startsWith("file:") || process.env.TURSO_AUTH_TOKEN),
  );
}

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
