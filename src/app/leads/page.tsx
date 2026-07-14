import { desc, eq } from "drizzle-orm";
import { Search } from "lucide-react";
import { db, isDatabaseConfigured } from "@/db";
import { businesses, campaigns } from "@/db/schema";
import { AppSidebar } from "@/components/app-sidebar";
import { LeadTable } from "@/components/lead-table";
import { demoLeads } from "@/lib/demo-data";

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
    <div className="app-frame">
      <AppSidebar qualified={qualified} active="leads" />
      <main className="route-main">
        <header className="route-header">
          <div>
            <span className="section-kicker">Pipeline</span>
            <h1>Leads</h1>
            <p>Search, filter and move every opportunity forward.</p>
          </div>
          <div className="route-summary">
            <Search />
            <span>{leads.length} total leads</span>
          </div>
        </header>
        <LeadTable leads={leads} demo={!configured} />
      </main>
    </div>
  );
}
