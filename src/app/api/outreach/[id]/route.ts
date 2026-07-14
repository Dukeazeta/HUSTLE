import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/db";
import { outreachDrafts } from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";

const schema = z.object({
  subject: z.string().max(200).nullable(),
  body: z.string().min(10).max(4000),
});
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");
  try {
    const draftId = (await params).id;
    const input = schema.parse(await request.json());
    const draft = await db.query.outreachDrafts.findFirst({
      where: eq(outreachDrafts.id, draftId),
    });
    if (!draft)
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    if (draft.sentAt)
      return NextResponse.json(
        { error: "Sent messages cannot be edited" },
        { status: 409 },
      );
    await db
      .update(outreachDrafts)
      .set({ ...input, updatedAt: new Date().toISOString() })
      .where(eq(outreachDrafts.id, draftId));
    return NextResponse.json({ draft: { ...draft, ...input } });
  } catch (error) {
    return apiError(error);
  }
}
