import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { aiUsage, usageEvents } from "@/db/schema";
import { UserError } from "@/lib/errors";
import { id } from "@/lib/ids";

/**
 * Today's UTC date as YYYY-MM-DD. Rows get created_at from SQLite's
 * CURRENT_TIMESTAMP ("2026-11-20 10:00:00"), which sorts *before* a full ISO
 * string ("2026-11-20T00:00:00.000Z") because a space sorts before "T". A
 * date-only prefix compares correctly against both formats.
 */
export function utcDayStart(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/** Reads a non-negative integer limit from the environment, or the fallback. */
export function envLimit(name: string, fallback: number) {
  const raw = process.env[name]?.trim();
  const value = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}

const DAILY_CAPS = {
  places_search: {
    env: "PLACES_DAILY_SEARCH_LIMIT",
    fallback: 5,
    noun: "searches",
  },
  audit: { env: "AUDIT_DAILY_LIMIT", fallback: 40, noun: "audits" },
} as const;

type UsageKind = keyof typeof DAILY_CAPS;

async function usageToday(workspaceId: string, kind: UsageKind) {
  const [row] = await db
    .select({ value: count() })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.workspaceId, workspaceId),
        eq(usageEvents.kind, kind),
        gte(usageEvents.createdAt, utcDayStart()),
      ),
    );
  return row?.value ?? 0;
}

/** Throws a 429 UserError once the workspace has used today's allowance. */
export async function assertDailyCap(workspaceId: string, kind: UsageKind) {
  const cap = DAILY_CAPS[kind];
  const limit = envLimit(cap.env, cap.fallback);
  if ((await usageToday(workspaceId, kind)) >= limit)
    throw new UserError(
      `You've used today's ${limit} ${cap.noun}. The limit resets at midnight UTC.`,
      429,
    );
}

export async function recordUsage(workspaceId: string, kind: UsageKind) {
  await db.insert(usageEvents).values({ id: id("use"), workspaceId, kind });
}

/** Gemini calls made by this workspace today, for GEMINI_DAILY_LIMIT. */
export async function geminiCallsToday(workspaceId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(aiUsage)
    .where(
      and(
        eq(aiUsage.workspaceId, workspaceId),
        gte(aiUsage.createdAt, utcDayStart()),
      ),
    );
  return row?.value ?? 0;
}
