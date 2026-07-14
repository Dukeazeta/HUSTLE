import { and, asc, eq, gt, isNotNull, lte } from "drizzle-orm";
import { CalendarClock } from "lucide-react";
import { db, isDatabaseConfigured } from "@/db";
import { businesses, outreachDrafts } from "@/db/schema";
import { AppSidebar } from "@/components/app-sidebar";
import { FollowUpQueue } from "@/components/follow-up-queue";

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
    <div className="app-frame">
      <AppSidebar active="followups" />
      <main className="route-main">
        <header className="route-header">
          <div>
            <span className="section-kicker">Manual reminders</span>
            <h1>Follow-ups</h1>
            <p>Review every message yourself. Nothing is sent automatically.</p>
          </div>
          <div className="route-summary">
            <CalendarClock />
            <span>{due.length} due now</span>
          </div>
        </header>
        <section className="route-section">
          <div className="section-title-row">
            <div>
              <span className="section-kicker">Needs attention</span>
              <h2>Due now</h2>
            </div>
          </div>
          <FollowUpQueue reminders={due} />
        </section>
        <section className="route-section">
          <div className="section-title-row">
            <div>
              <span className="section-kicker">Scheduled</span>
              <h2>Upcoming</h2>
            </div>
          </div>
          <FollowUpQueue reminders={upcoming} />
        </section>
      </main>
    </div>
  );
}
