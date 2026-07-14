import Link from "next/link";
import { and, desc, eq, isNotNull, lte } from "drizzle-orm";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Radar,
  ScanSearch,
  Send,
  Sparkles,
} from "lucide-react";
import { db, isDatabaseConfigured } from "@/db";
import { businesses, campaigns, outreachDrafts } from "@/db/schema";
import { AppSidebar } from "@/components/app-sidebar";
import { CampaignCreator } from "@/components/campaign-creator";
import { CampaignCard } from "@/components/campaign-card";
import { FollowUpQueue } from "@/components/follow-up-queue";
import { demoCampaigns, demoLeads } from "@/lib/demo-data";
export const dynamic = "force-dynamic";

export default async function Home() {
  const configured = isDatabaseConfigured();
  const campaignRows = configured
    ? await db
        .select()
        .from(campaigns)
        .orderBy(desc(campaigns.createdAt))
        .limit(6)
    : demoCampaigns;
  const leadRows = configured
    ? await db
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
        .limit(30)
    : demoLeads;
  const reminders = configured
    ? await db
        .select({
          draftId: outreachDrafts.id,
          businessId: businesses.id,
          businessName: businesses.name,
          channel: outreachDrafts.channel,
          dueAt: outreachDrafts.followUpDueAt,
          body: outreachDrafts.body,
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
        )
        .orderBy(outreachDrafts.followUpDueAt)
    : [];
  const qualified = leadRows.filter((lead) => lead.score >= 60).length;
  const contacted = leadRows.filter((lead) =>
    [
      "contacted",
      "replied",
      "meeting",
      "proposal",
      "preview",
      "payment_due",
      "won",
    ].includes(lead.stage),
  ).length;
  const won = leadRows.filter((lead) => lead.stage === "won").length;
  const queue = [...leadRows].sort((a, b) => b.score - a.score).slice(0, 5);
  return (
    <div className="app-frame">
      <AppSidebar qualified={qualified} />
      <main className="command-main">
        <header className="command-header">
          <div>
            <span className="section-kicker">Tuesday · 14 July 2026</span>
            <h1>Command centre</h1>
            <p>Move the right lead forward, one clear action at a time.</p>
          </div>
          <div className="header-actions">
            <button className="date-chip">
              <CalendarDays size={17} />
              14 July 2026
            </button>
            <CampaignCreator configured={configured} />
          </div>
        </header>
        <section className="today-section">
          <div className="section-title-row">
            <div>
              <span className="section-kicker">Today</span>
              <h2>What needs your attention</h2>
            </div>
            <small>{queue.length} priority leads</small>
          </div>
          <div className="attention-list">
            {queue.map((lead, index) => (
              <article key={lead.id}>
                <span
                  className={`attention-icon ${lead.stage === "discovered" ? "amber" : "green"}`}
                >
                  {lead.stage === "discovered" ? <ScanSearch /> : <Send />}
                </span>
                <div className="attention-action">
                  <b>
                    {lead.stage === "discovered"
                      ? "Audit due"
                      : lead.stage === "pitch_ready"
                        ? "Pitch ready"
                        : "Review lead"}
                  </b>
                  <span>{lead.name}</span>
                </div>
                <div className="attention-market">
                  {lead.city}, {lead.country}
                </div>
                <div className="attention-score">
                  <span>Score</span>
                  <b>
                    {lead.score}
                    <small>/100</small>
                  </b>
                </div>
                <Link
                  className={index === 0 ? "primary-row-action" : "row-action"}
                  href={`/leads/${lead.id}`}
                >
                  {index === 0 ? "Review next lead" : "Review"}
                  <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        </section>
        <section className="metric-strip">
          <Metric
            icon={<Radar />}
            label="Leads found"
            value={leadRows.length}
            note="Across both markets"
          />
          <Metric
            icon={<CheckCircle2 />}
            label="Qualified"
            value={qualified}
            note={`${leadRows.length ? Math.round((qualified / leadRows.length) * 100) : 0}% qualification rate`}
          />
          <Metric
            icon={<Send />}
            label="Contacted"
            value={contacted}
            note="Manual outreach only"
          />
          <Metric
            icon={<CircleDollarSign />}
            label="Clients won"
            value={won}
            note="Payment recorded"
          />
        </section>
        <div className="overview-grid">
          <section>
            <div className="section-title-row">
              <div>
                <span className="section-kicker">Prospecting</span>
                <h2>Latest campaign</h2>
              </div>
              <Link href="/campaigns" className="view-all-link">
                View all campaigns <ArrowRight size={14} />
              </Link>
            </div>
            <div className="campaign-grid">
              {campaignRows.slice(0, 1).map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  demo={!configured}
                />
              ))}
            </div>
          </section>
          <section>
            <div className="section-title-row">
              <div>
                <span className="section-kicker">Reminders</span>
                <h2>Follow-ups due</h2>
              </div>
              <Link href="/follow-ups" className="view-all-link">
                View all follow-ups <Clock3 size={14} />
              </Link>
            </div>
            <FollowUpQueue reminders={reminders.slice(0, 3)} />
          </section>
        </div>
        <section className="trust-banner">
          <span>
            <Sparkles />
          </span>
          <div>
            <b>Preview first. Payment before handover.</b>
            <small>
              Production access, source and credentials unlock only after full
              payment.
            </small>
          </div>
        </section>
      </main>
    </div>
  );
}
function Metric({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <article>
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{note}</p>
      </div>
    </article>
  );
}
