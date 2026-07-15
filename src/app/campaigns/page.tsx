import { desc } from "drizzle-orm";
import { Target } from "lucide-react";
import { db, isDatabaseConfigured } from "@/db";
import { campaigns } from "@/db/schema";
import { CampaignCard } from "@/components/campaign-card";
import { CampaignCreator } from "@/components/campaign-creator";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { demoCampaigns } from "@/lib/demo-data";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const configured = isDatabaseConfigured();
  const rows = configured
    ? await db.select().from(campaigns).orderBy(desc(campaigns.createdAt))
    : demoCampaigns;
  const activeCount = rows.filter((campaign) => campaign.status === "active").length;

  return (
    <AppShell active="campaigns">
      <PageHeader
        eyebrow="Discovery"
        title="Campaigns"
        description="Run one focused city search at a time, anywhere in the world."
        actions={<CampaignCreator configured={configured} />}
      />

      <section className={styles.summary} aria-label="Campaign summary">
        <div>
          <strong>{rows.length}</strong>
          <span>Total campaigns</span>
        </div>
        <div>
          <strong>{activeCount}</strong>
          <span>Active searches</span>
        </div>
        <p>
          Pricing and market review records live inside each campaign’s settings.
        </p>
      </section>

      {rows.length ? (
        <section className={styles.list} aria-label="Campaign list">
          {rows.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} demo={!configured} />
          ))}
        </section>
      ) : (
        <section className={styles.empty}>
          <span>
            <Target aria-hidden="true" />
          </span>
          <h2>Create your first campaign</h2>
          <p>Choose a country, city and business category to begin discovery.</p>
          <CampaignCreator configured={configured} />
        </section>
      )}
    </AppShell>
  );
}
