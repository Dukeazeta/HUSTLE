import { redirect } from "next/navigation";
import Link from "next/link";
import { and, desc, eq, isNotNull, lte } from "drizzle-orm";
import { ArrowRight, MapPin, Target } from "lucide-react";
import { db, isDatabaseConfigured } from "@/db";
import { businesses, campaigns, outreachDrafts } from "@/db/schema";
import { AppShell } from "@/components/layout/app-shell";
import { CampaignCreator } from "@/components/campaign-creator";
import { FollowUpQueue } from "@/components/follow-up-queue";
import { demoCampaigns, demoLeads } from "@/lib/demo-data";
import { countryName } from "@/lib/markets";
import styles from "./page.module.css";
import { requireWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function Home() {
  const workspace = await requireWorkspace();
  if (!workspace) redirect("/login");
  const configured = isDatabaseConfigured();
  const campaignRows = configured
    ? await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.workspaceId, workspace.workspaceId))
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
        .where(eq(businesses.workspaceId, workspace.workspaceId))
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
            eq(businesses.workspaceId, workspace.workspaceId),
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
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1>Command centre</h1>
            <p>{today}</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/leads" className={styles.secondary}>
              View pipeline
            </Link>
            <CampaignCreator configured={configured} />
          </div>
        </header>

        <section className={styles.snapshot} aria-label="Pipeline snapshot">
          <Snapshot label="Recent leads" value={leadRows.length} />
          <Snapshot label="Qualified" value={qualified} note="Score 60 or more" />
          <Snapshot label="Contacted" value={contacted} />
          <Snapshot label="Clients won" value={won} />
        </section>

        <section className={styles.panel} aria-labelledby="priority-title">
          <div className={styles.panelHeader}>
            <h2 id="priority-title">
              Priority leads <span>Highest score first, excluding won and opted-out leads.</span>
            </h2>
            <Link href="/leads" className={styles.textLink}>
              View all leads <ArrowRight aria-hidden="true" />
            </Link>
          </div>

          {queue.length ? (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Business</th>
                    <th scope="col">Market</th>
                    <th scope="col" className={styles.numeric}>
                      Score
                    </th>
                    <th scope="col">Stage</th>
                    <th scope="col">
                      <span className={styles.srOnly}>Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <div className={styles.business}>
                          <strong>
                            {lead.name}
                            {lead.id === nextLead?.id ? (
                              <span className={styles.nextTag}>Next</span>
                            ) : null}
                          </strong>
                          <span>{lead.category.replaceAll("_", " ")}</span>
                        </div>
                      </td>
                      <td className={styles.market}>
                        <MapPin aria-hidden="true" />
                        {lead.city}, {countryName(lead.country)}
                      </td>
                      <td className={styles.numeric}>
                        <span className={lead.score >= 60 ? styles.scoreHigh : styles.score}>
                          {lead.score}
                        </span>
                      </td>
                      <td>
                        <span className={styles.stage}>{lead.stage.replaceAll("_", " ")}</span>
                      </td>
                      <td className={styles.rowAction}>
                        <Link href={`/leads/${lead.id}`} aria-label={`Review ${lead.name}`}>
                          Review <ArrowRight aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.empty}>
              <strong>No leads need attention</strong>
              <p>Create a campaign and run a search to fill this list.</p>
            </div>
          )}
        </section>

        <div className={styles.lowerGrid}>
          <section className={styles.panel} aria-labelledby="campaign-title">
            <div className={styles.panelHeader}>
              <h2 id="campaign-title">Latest campaign</h2>
              <Link href="/campaigns" className={styles.textLink}>
                All campaigns <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            {latestCampaign ? (
              <div className={styles.campaign}>
                <span className={styles.campaignIcon}>
                  <Target aria-hidden="true" />
                </span>
                <div>
                  <strong>{latestCampaign.name}</strong>
                  <p>
                    {latestCampaign.city}, {countryName(latestCampaign.country)} ·{" "}
                    {latestCampaign.category.replaceAll("_", " ")}
                  </p>
                </div>
                <span className={styles.stage}>{latestCampaign.status}</span>
              </div>
            ) : (
              <div className={styles.empty}>
                <strong>No campaigns yet</strong>
                <p>A campaign is a city and a kind of business to search.</p>
              </div>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="followups-title">
            <div className={styles.panelHeader}>
              <h2 id="followups-title">Follow-ups due</h2>
              <Link href="/follow-ups" className={styles.textLink}>
                Open queue <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.panelBody}>
              <FollowUpQueue reminders={reminders.slice(0, 3)} compact />
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Snapshot({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className={styles.stat}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}
