import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export function isDatabaseConfigured() {
  return Boolean(process.env.TURSO_CONNECTION_URL);
}

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
