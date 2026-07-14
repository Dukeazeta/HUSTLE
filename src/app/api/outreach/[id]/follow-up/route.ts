import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/db";
import { outreachDrafts } from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";
import { buildFollowUp } from "@/lib/workflow";

const editSchema = z.object({
  subject: z.string().max(200).nullable().optional(),
  body: z.string().min(10).max(4000).optional(),
});
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");
  try {
    const draftId = (await params).id;
    const input = editSchema.parse(await request.json().catch(() => ({})));
    const draft = await db.query.outreachDrafts.findFirst({
      where: eq(outreachDrafts.id, draftId),
    });
    if (!draft || !draft.sentAt)
      return NextResponse.json(
        { error: "Send the original message before preparing a follow-up" },
        { status: 409 },
      );
    if (draft.followUpSentAt)
      return NextResponse.json({
        subject: draft.followUpSubject,
        body: draft.followUpBody,
        sentAt: draft.followUpSentAt,
      });
    const generated = draft.followUpBody
      ? { subject: draft.followUpSubject, body: draft.followUpBody }
      : buildFollowUp(draft.body, draft.channel);
    const followUp = {
      subject: input.subject ?? generated.subject,
      body: input.body ?? generated.body,
    };
    await db
      .update(outreachDrafts)
      .set({
        followUpSubject: followUp.subject,
        followUpBody: followUp.body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(outreachDrafts.id, draftId));
    return NextResponse.json(followUp);
  } catch (error) {
    return apiError(error);
  }
}
