import { NextResponse } from "next/server";
import { and, eq, isNotNull, lte } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { businesses, outreachDrafts } from "@/db/schema";

export async function GET(request: Request) {
  const token = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || token !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDatabaseConfigured())
    return NextResponse.json(
      { error: "Turso is not configured" },
      { status: 503 },
    );
  const due = await db
    .select({
      draftId: outreachDrafts.id,
      businessId: businesses.id,
      businessName: businesses.name,
      channel: outreachDrafts.channel,
      dueAt: outreachDrafts.followUpDueAt,
    })
    .from(outreachDrafts)
    .innerJoin(businesses, eq(outreachDrafts.businessId, businesses.id))
    .where(
      and(
        eq(outreachDrafts.status, "sent"),
        eq(businesses.suppressed, false),
        isNotNull(outreachDrafts.followUpDueAt),
        lte(outreachDrafts.followUpDueAt, new Date().toISOString()),
      ),
    );
  return NextResponse.json({ due: due.length, reminders: due });
}
