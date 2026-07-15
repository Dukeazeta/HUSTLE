import { desc, eq } from "drizzle-orm";
import { BriefcaseBusiness } from "lucide-react";
import { db, isDatabaseConfigured } from "@/db";
import { businesses, campaigns } from "@/db/schema";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { LeadTable } from "@/components/lead-table";
import { demoLeads } from "@/lib/demo-data";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const configured = isDatabaseConfigured();
  const leads = configured
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
        .limit(200)
    : demoLeads;
  const qualified = leads.filter((lead) => lead.score >= 60).length;

  return (
    <AppShell active="leads">
      <PageHeader
        eyebrow="Pipeline"
        title="Leads"
        description="Find the right business quickly, then continue its next workflow step."
        actions={
          <div className={styles.summary}>
            <BriefcaseBusiness aria-hidden="true" />
            <span>
              <strong>{leads.length}</strong> recent · {qualified} qualified
            </span>
          </div>
        }
      />
      <LeadTable leads={leads} demo={!configured} />
    </AppShell>
  );
}
