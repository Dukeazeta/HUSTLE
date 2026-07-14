import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/db";
import { campaigns } from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";
import { id } from "@/lib/ids";

const inputSchema = z.object({
  name: z.string().min(3).max(80),
  country: z.enum(["NG", "UK"]),
  city: z.string().min(2).max(80),
  category: z.enum(CATEGORIES),
  resultLimit: z.number().int().min(1).max(60).default(20),
  budgetMinor: z.number().int().min(0).default(0),
});

export async function GET() {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return NextResponse.json({ campaigns: [] });
  return NextResponse.json({
    campaigns: await db
      .select()
      .from(campaigns)
      .orderBy(desc(campaigns.createdAt)),
  });
}

export async function POST(request: Request) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");
  try {
    const data = inputSchema.parse(await request.json());
    const record = { id: id("cmp"), ...data, status: "active" as const };
    await db.insert(campaigns).values(record);
    return NextResponse.json({ campaign: record }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
