import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { businesses, campaigns } from "@/db/schema";
import { requireOwner, unauthorized } from "@/lib/api";

export async function GET() {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return NextResponse.json({ leads: [] });
  const leads = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      category: businesses.category,
      country: businesses.country,
      city: businesses.city,
      websiteUrl: businesses.websiteUrl,
      score: businesses.score,
      stage: businesses.stage,
      suppressed: businesses.suppressed,
      campaignName: campaigns.name,
    })
    .from(businesses)
    .leftJoin(campaigns, eq(businesses.campaignId, campaigns.id))
    .orderBy(desc(businesses.updatedAt))
    .limit(200);
  return NextResponse.json({ leads });
}
