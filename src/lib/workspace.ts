import { asc, desc, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { workspaceMembers, workspaces } from "@/db/schema";
import { DEMO_USER, isDemoMode } from "@/lib/demo";

/** Data that existed before workspaces. Claimed once by LEGACY_DATA_OWNER_EMAIL. */
export const LEGACY_WORKSPACE_ID = "ws_legacy";
export const DEMO_WORKSPACE_ID = "ws_demo";

export type WorkspaceContext = {
  userId: string;
  email: string;
  workspaceId: string;
  role: "owner" | "member";
};

/** The signed-in user's workspace, created on first use. Null when signed out. */
export async function requireWorkspace(): Promise<WorkspaceContext | null> {
  if (isDemoMode())
    return {
      userId: "demo",
      email: DEMO_USER.email,
      workspaceId: DEMO_WORKSPACE_ID,
      role: "owner",
    };
  const session = await auth();
  const userId = session?.user?.id;
  const email = session?.user?.email?.toLowerCase();
  if (!userId || !email) return null;
  return resolveWorkspace({ userId, email, name: session?.user?.name ?? null });
}

async function membershipFor(userId: string) {
  const [membership] = await db
    .select({
      workspaceId: workspaceMembers.workspaceId,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    // The original workspace wins if this user claimed it; otherwise the oldest.
    .orderBy(
      desc(sql`${workspaceMembers.workspaceId} = ${LEGACY_WORKSPACE_ID}`),
      asc(workspaceMembers.createdAt),
      asc(workspaceMembers.workspaceId),
    )
    .limit(1);
  return membership;
}

/**
 * Finds or creates the user's workspace. Every step is idempotent, so two
 * simultaneous first requests still end up with a single workspace.
 */
export async function resolveWorkspace(user: {
  userId: string;
  email: string;
  name: string | null;
}): Promise<WorkspaceContext> {
  const email = user.email.toLowerCase();
  const legacyOwner = process.env.LEGACY_DATA_OWNER_EMAIL?.trim().toLowerCase();
  if (legacyOwner && legacyOwner === email)
    // One atomic statement: only succeeds while the original workspace has no members.
    await db.run(sql`
      INSERT INTO workspace_members (workspace_id, user_id, role)
      SELECT ${LEGACY_WORKSPACE_ID}, ${user.userId}, 'owner'
      WHERE EXISTS (SELECT 1 FROM workspaces WHERE id = ${LEGACY_WORKSPACE_ID})
        AND NOT EXISTS (
          SELECT 1 FROM workspace_members WHERE workspace_id = ${LEGACY_WORKSPACE_ID}
        )
    `);

  const existing = await membershipFor(user.userId);
  if (existing) return { userId: user.userId, email, ...existing };

  const workspaceId = `ws_${user.userId}`;
  const firstName = user.name?.trim().split(/\s+/)[0];
  // A batch runs atomically in one round trip and never interleaves with others.
  await db.batch([
    db
      .insert(workspaces)
      .values({
        id: workspaceId,
        name: firstName ? `${firstName}'s workspace` : "My workspace",
      })
      .onConflictDoNothing(),
    db
      .insert(workspaceMembers)
      .values({ workspaceId, userId: user.userId, role: "owner" })
      .onConflictDoNothing(),
  ]);
  const created = await membershipFor(user.userId);
  if (!created) throw new Error("Workspace could not be created");
  return { userId: user.userId, email, ...created };
}
