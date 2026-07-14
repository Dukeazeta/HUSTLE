import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/db";
import { opportunities, proposals } from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";
import { id } from "@/lib/ids";
const schema = z.object({ title: z.string().min(3).max(120), content: z.string().min(50).max(12000), expiresAt: z.string().datetime() });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { if (!(await requireOwner())) return unauthorized(); if (!isDatabaseConfigured()) return notConfigured("Turso"); try { const opportunityId = (await params).id; const input = schema.parse(await request.json()); const opportunity = await db.query.opportunities.findFirst({ where: eq(opportunities.id, opportunityId) }); if (!opportunity) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 }); const record = { id: id("prp"), opportunityId, ...input }; await db.insert(proposals).values(record); await db.update(opportunities).set({ stage: "proposal", updatedAt: new Date().toISOString() }).where(eq(opportunities.id, opportunityId)); return NextResponse.json({ proposal: record }, { status: 201 }); } catch (error) { return apiError(error); } }
