import { desc } from "drizzle-orm";
import { Target } from "lucide-react";
import { db, isDatabaseConfigured } from "@/db";
import { campaigns } from "@/db/schema";
import { AppSidebar } from "@/components/app-sidebar";
import { CampaignCard } from "@/components/campaign-card";
import { CampaignCreator } from "@/components/campaign-creator";
import { demoCampaigns } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const configured = isDatabaseConfigured();
  const rows = configured
    ? await db.select().from(campaigns).orderBy(desc(campaigns.createdAt))
    : demoCampaigns;

  return (
    <div className="app-frame">
      <AppSidebar active="campaigns" />
      <main className="route-main">
        <header className="route-header">
          <div>
            <span className="section-kicker">Prospecting</span>
            <h1>Campaigns</h1>
            <p>Keep Nigeria and UK searches bounded, intentional and separate.</p>
          </div>
          <CampaignCreator configured={configured} />
        </header>
        <div className="route-callout">
          <Target />
          <div>
            <b>One city and category per campaign</b>
            <span>Run searches manually and stay inside the campaign budget.</span>
          </div>
        </div>
        <div className="campaign-page-grid">
          {rows.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} demo={!configured} />
          ))}
        </div>
      </main>
    </div>
  );
}
