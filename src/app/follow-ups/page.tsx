import { and, asc, eq, gt, isNotNull, lte } from "drizzle-orm";
import { CalendarClock } from "lucide-react";
import { db, isDatabaseConfigured } from "@/db";
import { businesses, outreachDrafts } from "@/db/schema";
import { FollowUpQueue } from "@/components/follow-up-queue";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function FollowUpsPage() {
  const configured = isDatabaseConfigured();
  const now = new Date().toISOString();
  const baseQuery = {
    draftId: outreachDrafts.id,
    businessId: businesses.id,
    businessName: businesses.name,
    channel: outreachDrafts.channel,
    dueAt: outreachDrafts.followUpDueAt,
    body: outreachDrafts.body,
  };
  const due = configured
    ? await db
        .select(baseQuery)
        .from(outreachDrafts)
        .innerJoin(businesses, eq(outreachDrafts.businessId, businesses.id))
        .where(
          and(
            eq(outreachDrafts.status, "sent"),
            eq(businesses.suppressed, false),
            isNotNull(outreachDrafts.followUpDueAt),
            lte(outreachDrafts.followUpDueAt, now),
          ),
        )
        .orderBy(asc(outreachDrafts.followUpDueAt))
    : [];
  const upcoming = configured
    ? await db
        .select(baseQuery)
        .from(outreachDrafts)
        .innerJoin(businesses, eq(outreachDrafts.businessId, businesses.id))
        .where(
          and(
            eq(outreachDrafts.status, "sent"),
            eq(businesses.suppressed, false),
            isNotNull(outreachDrafts.followUpDueAt),
            gt(outreachDrafts.followUpDueAt, now),
          ),
        )
        .orderBy(asc(outreachDrafts.followUpDueAt))
    : [];

  return (
    <AppShell active="followups">
      <PageHeader
        eyebrow="Manual reminders"
        title="Follow-ups"
        description="Review every message yourself. HUSTLE never sends outreach automatically."
        actions={
          <div className={styles.summary}>
            <CalendarClock aria-hidden="true" />
            <strong>{due.length}</strong>
            <span>due now</span>
          </div>
        }
      />

      <div className={styles.sections}>
        <section aria-labelledby="due-heading">
          <div className={styles.sectionHeader}>
            <div>
              <span>Needs attention</span>
              <h2 id="due-heading">Due now</h2>
            </div>
            <small>{due.length} reminders</small>
          </div>
          <FollowUpQueue
            reminders={due}
            emptyTitle="You’re caught up"
            emptyBody="No follow-up messages need your attention right now."
          />
        </section>

        <section aria-labelledby="upcoming-heading">
          <div className={styles.sectionHeader}>
            <div>
              <span>Scheduled</span>
              <h2 id="upcoming-heading">Upcoming</h2>
            </div>
            <small>{upcoming.length} reminders</small>
          </div>
          <FollowUpQueue
            reminders={upcoming}
            emptyTitle="Nothing scheduled"
            emptyBody="Future reminders will appear here after outreach is recorded."
          />
        </section>
      </div>
    </AppShell>
  );
}
