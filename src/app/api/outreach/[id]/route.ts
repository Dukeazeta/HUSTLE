import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/db";
import { outreachDrafts } from "@/db/schema";
import { apiError, notConfigured, parseBody, unauthorized } from "@/lib/api";
import { getOwnedDraft } from "@/lib/ownership";
import { requireWorkspace } from "@/lib/workspace";

const schema = z.object({
  subject: z.string().max(200).nullable().optional(),
  body: z.string().min(10).max(4000).optional(),
  feedback: z.enum(["up", "down"]).nullable().optional(),
});
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const workspace = await requireWorkspace();
  if (!workspace) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");
  try {
    const draftId = (await params).id;
    const input = await parseBody(request, schema);
    if (!Object.keys(input).length)
      return NextResponse.json(
        { error: "No draft changes were provided" },
        { status: 400 },
      );
    const draft = await getOwnedDraft(workspace.workspaceId, draftId);
    if (!draft)
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    if (draft.sentAt && (input.subject !== undefined || input.body !== undefined))
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
