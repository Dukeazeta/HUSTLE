import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db, isDatabaseConfigured } from "@/db";
import {
  activities,
  audits,
  businessLinks,
  businesses,
  campaigns,
  contacts,
  findings,
  opportunities,
  outreachDrafts,
  pitchGenerations,
  pitchVariants,
  proposals,
} from "@/db/schema";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { LeadWorkspace } from "@/components/lead-workspace";
import { demoCampaigns, demoLeads } from "@/lib/demo-data";
import styles from "./page.module.css";
export const dynamic = "force-dynamic";
export default async function LeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const leadId = (await params).id;
  const configured = isDatabaseConfigured();
  const lead = configured
    ? await db.query.businesses.findFirst({ where: eq(businesses.id, leadId) })
    : demoLeads.find((item) => item.id === leadId);
  if (!lead) notFound();
  const liveLead = configured ? (lead as typeof businesses.$inferSelect) : null;
  const demoLead = configured ? null : (lead as (typeof demoLeads)[number]);
  const campaign = configured
    ? await db.query.campaigns.findFirst({
        where: eq(campaigns.id, liveLead!.campaignId),
      })
    : demoCampaigns.find((item) => item.name === demoLead!.campaignName);
  if (!campaign) notFound();
  const audit = configured
    ? await db.query.audits.findFirst({
        where: eq(audits.businessId, leadId),
        orderBy: [desc(audits.createdAt)],
      })
    : {
        id: "demo-audit",
        summary:
          "The listing has no website, creating a strong mobile-first website opportunity.",
        score: lead.score,
      };
  const evidence =
    configured && audit
      ? await db.select().from(findings).where(eq(findings.auditId, audit.id))
      : lead.score
        ? [
            {
              id: "demo-f1",
              code: "missing_website",
              severity: "high",
              title: "No business website",
              evidence: "The public business listing has no website URL.",
              recommendation: "Launch a focused mobile-first website.",
            },
          ]
        : [];
  const drafts = configured
    ? await db
        .select()
        .from(outreachDrafts)
        .where(eq(outreachDrafts.businessId, leadId))
        .orderBy(desc(outreachDrafts.createdAt))
    : [];
  const latestGeneration = configured
    ? ((await db.query.pitchGenerations.findFirst({
        where: eq(pitchGenerations.businessId, leadId),
        orderBy: [desc(pitchGenerations.createdAt)],
      })) ?? null)
    : null;
  const generationVariants =
    configured && latestGeneration
      ? await db
          .select()
          .from(pitchVariants)
          .where(eq(pitchVariants.generationId, latestGeneration.id))
      : [];
  const contactRows = configured
    ? await db.select().from(contacts).where(eq(contacts.businessId, leadId))
    : [];
  const linkRows = configured
    ? await db
        .select()
        .from(businessLinks)
        .where(eq(businessLinks.businessId, leadId))
        .orderBy(desc(businessLinks.confidence))
    : [];
  const opportunity = configured
    ? ((await db.query.opportunities.findFirst({
        where: eq(opportunities.businessId, leadId),
      })) ?? null)
    : null;
  const proposal =
    configured && opportunity
      ? ((await db.query.proposals.findFirst({
          where: eq(proposals.opportunityId, opportunity.id),
          orderBy: [desc(proposals.updatedAt)],
        })) ?? null)
      : null;
  const activityRows = configured
    ? await db
        .select()
        .from(activities)
        .where(eq(activities.businessId, leadId))
        .orderBy(desc(activities.createdAt))
    : [];
  const workspaceLead = {
    id: lead.id,
    name: lead.name,
    country: lead.country,
    city: lead.city,
    category: lead.category,
    score: lead.score,
    stage: lead.stage,
    sourceUrl: liveLead?.sourceUrl ?? "https://www.google.com/maps",
    websiteUrl: lead.websiteUrl ?? null,
    legalForm: liveLead?.legalForm ?? "unknown",
    complianceReviewed: liveLead?.complianceReviewed ?? false,
    outreachBasis: liveLead?.outreachBasis ?? null,
    outreachBasisNote: liveLead?.outreachBasisNote ?? null,
    outreachBasisReviewedAt: liveLead?.outreachBasisReviewedAt ?? null,
    suppressed: lead.suppressed,
  };
  return (
    <AppShell active="leads">
      <PageHeader
        eyebrow="Lead workspace"
        title={lead.name}
        description="Review the evidence, make the next decision and keep every action manual."
        actions={
          <Link href="/leads" className={styles.backLink}>
            <ArrowLeft aria-hidden="true" />
            All leads
          </Link>
        }
        lead={{
          name: lead.name,
          category: lead.category,
          city: lead.city,
          country: lead.country,
          score: lead.score,
          stage: lead.stage,
        }}
      />
      <LeadWorkspace
        lead={workspaceLead as Parameters<typeof LeadWorkspace>[0]["lead"]}
        campaign={campaign}
        demo={!configured}
        canDraft={Boolean(audit && !lead.suppressed)}
        drafts={drafts as Parameters<typeof LeadWorkspace>[0]["drafts"]}
        generation={latestGeneration}
        variants={generationVariants}
        contacts={
          contactRows as Parameters<typeof LeadWorkspace>[0]["contacts"]
        }
        links={linkRows as Parameters<typeof LeadWorkspace>[0]["links"]}
        opportunity={opportunity}
        proposal={proposal}
        activities={activityRows}
        evidence={evidence}
        auditSummary={audit?.summary ?? null}
      />
    </AppShell>
  );
}
