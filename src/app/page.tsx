import Link from "next/link";
import { and, desc, eq, isNotNull, lte } from "drizzle-orm";
import { ArrowUpRight, MapPin, Target } from "lucide-react";
import { db, isDatabaseConfigured } from "@/db";
import { businesses, campaigns, outreachDrafts } from "@/db/schema";
import { AppShell } from "@/components/layout/app-shell";
import { CampaignCreator } from "@/components/campaign-creator";
import { FollowUpQueue } from "@/components/follow-up-queue";
import { demoCampaigns, demoLeads } from "@/lib/demo-data";
import { countryName } from "@/lib/markets";
import styles from "./page.module.css";

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
  const queue = [...leadRows]
    .filter((lead) => !lead.suppressed && lead.stage !== "won")
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  const nextLead = queue[0];
  const latestCampaign = campaignRows[0];
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <AppShell active="command">
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span>{today}</span>
          <h1>Move the right opportunity forward.</h1>
          <p>
            HUSTLE keeps discovery, evidence and manual outreach in one clear
            private workspace.
          </p>
          <div className={styles.heroAction}>
            <CampaignCreator configured={configured} />
            <Link href="/leads">
              View pipeline <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className={styles.heroStack} aria-label="Pipeline highlight">
          <div className={styles.heroCard}>
            <span>Next best lead</span>
            {nextLead ? (
              <>
                <strong>{nextLead.name}</strong>
                <p>
                  <MapPin aria-hidden="true" />
                  {nextLead.city}, {countryName(nextLead.country)}
                </p>
                <div>
                  <span>Opportunity score</span>
                  <b>{nextLead.score}</b>
                </div>
                <Link href={`/leads/${nextLead.id}`}>
                  Review lead <ArrowUpRight aria-hidden="true" />
                </Link>
              </>
            ) : (
              <p>Create a campaign to begin finding opportunities.</p>
            )}
          </div>
          <div className={styles.heroMiniCard}>
            <span>Qualified</span>
            <strong>{qualified}</strong>
            <small>of {leadRows.length} recent leads</small>
          </div>
        </div>
      </section>

      <section className={styles.snapshot} aria-label="Pipeline snapshot">
        <Snapshot label="Recent leads" value={leadRows.length} />
        <Snapshot label="Qualified" value={qualified} />
        <Snapshot label="Contacted" value={contacted} />
        <Snapshot label="Clients won" value={won} />
      </section>

      <section className={styles.priority} aria-labelledby="priority-title">
        <div className={styles.sectionHeader}>
          <div>
            <span>Next actions</span>
            <h2 id="priority-title">Priority leads</h2>
          </div>
          <Link href="/leads">View all leads</Link>
        </div>

        <div className={styles.assetList}>
          {queue.length ? (
            queue.map((lead, index) => (
              <article key={lead.id} className={styles.assetRow}>
                <span className={styles.assetIcon}>{index + 1}</span>
                <div className={styles.assetIdentity}>
                  <strong>{lead.name}</strong>
                  <span>{lead.category.replaceAll("_", " ")}</span>
                </div>
                <div className={styles.assetMarket}>
                  <span>Market</span>
                  <strong>
                    {lead.city}, {countryName(lead.country)}
                  </strong>
                </div>
                <div className={styles.assetScore}>
                  <span>Score</span>
                  <strong>{lead.score}</strong>
                </div>
                <span className={styles.stage}>
                  {lead.stage.replaceAll("_", " ")}
                </span>
                <Link href={`/leads/${lead.id}`} aria-label={`Review ${lead.name}`}>
                  Review <ArrowUpRight aria-hidden="true" />
                </Link>
              </article>
            ))
          ) : (
            <div className={styles.empty}>No leads need attention right now.</div>
          )}
        </div>
      </section>

      <div className={styles.lowerGrid}>
        <section className={styles.featureCard}>
          <div className={styles.sectionHeader}>
            <div>
              <span>Discovery</span>
              <h2>Latest campaign</h2>
            </div>
            <Link href="/campaigns">All campaigns</Link>
          </div>
          {latestCampaign ? (
            <div className={styles.campaign}>
              <span>
                <Target aria-hidden="true" />
              </span>
              <div>
                <strong>{latestCampaign.name}</strong>
                <p>
                  {latestCampaign.city}, {countryName(latestCampaign.country)} ·{" "}
                  {latestCampaign.category.replaceAll("_", " ")}
                </p>
              </div>
              <b>{latestCampaign.status}</b>
            </div>
          ) : (
            <div className={styles.empty}>No campaigns yet.</div>
          )}
        </section>

        <section className={styles.featureCard}>
          <div className={styles.sectionHeader}>
            <div>
              <span>Reminders</span>
              <h2>Follow-ups due</h2>
            </div>
            <Link href="/follow-ups">Open queue</Link>
          </div>
          <FollowUpQueue reminders={reminders.slice(0, 3)} compact />
        </section>
      </div>
    </AppShell>
  );
}

function Snapshot({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
