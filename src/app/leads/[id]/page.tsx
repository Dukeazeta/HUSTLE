import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { db, isDatabaseConfigured } from "@/db";
import { audits, businesses, findings, outreachDrafts } from "@/db/schema";
import { LeadWorkspace } from "@/components/lead-workspace";
import { demoLeads } from "@/lib/demo-data";
export const dynamic = "force-dynamic";
type DraftShape = { id: string; channel: "email" | "whatsapp"; subject: string | null; body: string; status: string; sentAt: string | null };
export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const leadId = (await params).id; const configured = isDatabaseConfigured(); const lead = configured ? await db.query.businesses.findFirst({ where: eq(businesses.id, leadId) }) : demoLeads.find((item) => item.id === leadId); if (!lead) notFound();
  const audit = configured ? await db.query.audits.findFirst({ where: eq(audits.businessId, leadId), orderBy: [desc(audits.createdAt)] }) : { id: "demo-audit", summary: "The listing has no website, creating a strong mobile-first website opportunity.", score: lead.score };
  const evidence = configured && audit ? await db.select().from(findings).where(eq(findings.auditId, audit.id)) : lead.score ? [{ id: "demo-f1", severity: "high", title: "No business website", evidence: "The public business listing has no website URL.", recommendation: "Launch a focused mobile-first website." }] : [];
  const drafts = configured ? await db.select().from(outreachDrafts).where(eq(outreachDrafts.businessId, leadId)).orderBy(desc(outreachDrafts.createdAt)) : [];
  return <main className="lead-page"><Link href="/" className="back-link"><ArrowLeft size={15} />Back to command centre</Link><div className="lead-hero"><div className="lead-title-row"><span className="business-avatar large">{lead.name.slice(0,2).toUpperCase()}</span><div><span className="eyebrow">{lead.category.replaceAll("_", " ")}</span><h1>{lead.name}</h1><p><MapPin size={14} />{lead.city}, {lead.country}</p></div></div><div className="lead-score"><small>Opportunity score</small><strong>{lead.score}</strong><span>/100</span></div></div><div className="detail-grid"><section className="detail-card"><span className="eyebrow">Evidence</span><h2>Website audit</h2>{audit ? <><p className="audit-summary">{audit.summary}</p><div className="finding-list">{evidence.map((item) => <article key={item.id}><span className={`severity ${item.severity}`}>{item.severity}</span><div><strong>{item.title}</strong><p>{item.evidence}</p><small>{item.recommendation}</small></div></article>)}</div></> : <p className="audit-summary">No audit has been run yet.</p>}{lead.websiteUrl && <a className="source-link" href={lead.websiteUrl} target="_blank" rel="noreferrer">Open public website <ExternalLink size={14} /></a>}</section><section className="detail-card"><span className="eyebrow">Human-approved outreach</span><h2>Pitch workspace</h2><p className="audit-summary">Draft from verified findings, edit if needed, then confirm only after you send it yourself.</p><LeadWorkspace leadId={leadId} demo={!configured} canDraft={Boolean(audit && evidence.length && !lead.suppressed)} drafts={drafts as DraftShape[]} /></section></div></main>;
}
