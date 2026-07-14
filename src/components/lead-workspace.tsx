"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  AtSign,
  BriefcaseBusiness,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Copy,
  ExternalLink,
  FileText,
  Globe2,
  LoaderCircle,
  Mail,
  MessageCircle,
  Music2,
  Plus,
  Save,
  ScanSearch,
  Search,
  ShieldCheck,
  ShieldX,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Users,
  X,
} from "lucide-react";
import {
  OUTREACH_CHANNELS,
  PACKAGES,
  PIPELINE_STAGES,
  type OutreachChannel,
} from "@/lib/constants";

type Draft = {
  id: string;
  channel: OutreachChannel;
  sourceVariantId: string | null;
  subject: string | null;
  body: string;
  feedback: "up" | "down" | null;
  status: string;
  sentAt: string | null;
  followUpDueAt: string | null;
  followUpSubject: string | null;
  followUpBody: string | null;
  followUpSentAt: string | null;
};

type PitchGeneration = {
  id: string;
  channel: OutreachChannel;
  usedFallback: boolean;
} | null;

type PitchVariant = {
  id: string;
  generationId: string;
  label: "short" | "warm" | "specific";
  subject: string | null;
  body: string;
  evidenceCodes: string[];
};

type Contact = {
  id: string;
  channel: "email" | "phone" | "whatsapp";
  value: string;
  sourceUrl: string;
  verified: boolean;
  isPrimary: boolean;
  verificationMethod: "unverified" | "manual" | "published_whatsapp";
};

type BusinessLink = {
  id: string;
  type: "website" | "instagram" | "linkedin" | "facebook" | "x" | "tiktok";
  url: string;
  sourceUrl: string;
  verificationStatus: "candidate" | "confirmed" | "rejected";
  confidence: number;
  evidence: string;
};

type Opportunity = {
  id: string;
  stage: string;
  packageName: string | null;
  currency: string | null;
  valueMinor: number | null;
  nextActionAt: string | null;
  previewUrl: string | null;
  previewApprovedAt: string | null;
  paidAt: string | null;
} | null;

type Proposal = {
  id: string;
  title: string;
  content: string;
  expiresAt: string;
} | null;

type Activity = {
  id: string;
  type: string;
  detail: string | null;
  createdAt: string;
};

type Evidence = {
  id: string;
  code: string;
  severity: string;
  title: string;
  evidence: string;
  recommendation: string;
};

type Lead = {
  id: string;
  name: string;
  country: string;
  stage: string;
  sourceUrl: string;
  websiteUrl: string | null;
  legalForm: "corporate" | "sole_trader" | "unknown";
  complianceReviewed: boolean;
  outreachBasis: "corporate_b2b" | "consent" | "solicited_request" | null;
  outreachBasisNote: string | null;
  outreachBasisReviewedAt: string | null;
  suppressed: boolean;
  score: number;
  category: string;
  city: string;
};

const workflow = [
  { id: "audit", label: "Audit", icon: ScanSearch },
  { id: "contact", label: "Contact", icon: ShieldCheck },
  { id: "pitch", label: "Pitch", icon: MessageCircle },
  { id: "proposal", label: "Proposal", icon: FileText },
  { id: "preview", label: "Preview", icon: Globe2 },
  { id: "payment", label: "Payment", icon: CircleDollarSign },
] as const;

const businessLinkIcons = {
  website: Globe2,
  instagram: Camera,
  linkedin: BriefcaseBusiness,
  facebook: Users,
  x: AtSign,
  tiktok: Music2,
};

type WorkflowStage = (typeof workflow)[number]["id"];

function initialWorkflow(stage: string): WorkflowStage {
  if (["discovered", "audited", "qualified"].includes(stage)) return "audit";
  if (stage === "pitch_ready") return "pitch";
  if (["contacted", "replied", "meeting"].includes(stage)) return "pitch";
  if (stage === "proposal") return "proposal";
  if (stage === "preview") return "preview";
  if (["payment_due", "won"].includes(stage)) return "payment";
  return "contact";
}

export function LeadWorkspace({
  lead: initialLead,
  demo,
  canDraft,
  drafts: initialDrafts,
  generation: initialGeneration,
  variants: initialVariants,
  contacts: initialContacts,
  links: initialLinks,
  opportunity: initialOpportunity,
  proposal: initialProposal,
  activities,
  evidence,
  auditSummary,
}: {
  lead: Lead;
  demo: boolean;
  canDraft: boolean;
  drafts: Draft[];
  generation: PitchGeneration;
  variants: PitchVariant[];
  contacts: Contact[];
  links: BusinessLink[];
  opportunity: Opportunity;
  proposal: Proposal;
  activities: Activity[];
  evidence: Evidence[];
  auditSummary: string | null;
}) {
  const [lead, setLead] = useState(initialLead);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [generation, setGeneration] = useState(initialGeneration);
  const [variants, setVariants] = useState(initialVariants);
  const [contacts, setContacts] = useState(initialContacts);
  const [links, setLinks] = useState(initialLinks);
  const [opportunity, setOpportunity] = useState(initialOpportunity);
  const [active, setActive] = useState<WorkflowStage>(
    initialWorkflow(initialLead.stage),
  );
  const [message, setMessage] = useState("");
  const [messageClosing, setMessageClosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkedWhatsAppContact, setCheckedWhatsAppContact] = useState("");
  const [contactForm, setContactForm] = useState({
    channel: "email" as Contact["channel"],
    value: "",
    sourceUrl: lead.websiteUrl ?? lead.sourceUrl,
  });

  useEffect(() => {
    if (!message) return;
    const revealMessage = window.setTimeout(
      () => setMessageClosing(false),
      0,
    );
    const startClosing = window.setTimeout(
      () => setMessageClosing(true),
      7_800,
    );
    const clearMessage = window.setTimeout(() => setMessage(""), 8_000);
    return () => {
      window.clearTimeout(revealMessage);
      window.clearTimeout(startClosing);
      window.clearTimeout(clearMessage);
    };
  }, [message]);

  function dismissMessage() {
    setMessageClosing(true);
    window.setTimeout(() => setMessage(""), 180);
  }

  async function request(path: string, method = "POST", body: object = {}) {
    if (demo) {
      setMessage("Demo data is read-only.");
      return null;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      return data;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
      return null;
    } finally {
      setBusy(false);
    }
  }

  function refresh(text: string) {
    setMessage(text);
    setTimeout(() => location.reload(), 500);
  }

  async function audit() {
    const data = await request(`/api/leads/${lead.id}/audit`);
    if (data) refresh(`Audit complete: ${data.audit.score}/100`);
  }

  async function draft(channel: OutreachChannel) {
    const data = await request(`/api/leads/${lead.id}/draft`, "POST", {
      channel,
      requestId: crypto.randomUUID(),
    });
    if (data) {
      setGeneration(data.generation);
      setVariants(data.variants);
      setMessage("Three pitch options are ready. Choose one to edit.");
    }
  }

  async function selectVariant(variant: PitchVariant) {
    const data = await request(`/api/pitch-variants/${variant.id}/select`);
    if (!data) return;
    setDrafts((rows) => [
      {
        followUpDueAt: null,
        followUpSubject: null,
        followUpBody: null,
        followUpSentAt: null,
        sentAt: null,
        ...data.draft,
      },
      ...rows.filter((row) => row.id !== data.draft.id),
    ]);
    setMessage(`${variant.label} variant selected. Edit it before sending.`);
  }

  async function saveDraft(item: Draft) {
    if (
      await request(`/api/outreach/${item.id}`, "PATCH", {
        subject: item.subject,
        body: item.body,
      })
    ) {
      setMessage("Draft saved.");
    }
  }

  async function rateDraft(item: Draft, feedback: "up" | "down") {
    const nextFeedback = item.feedback === feedback ? null : feedback;
    const data = await request(`/api/outreach/${item.id}`, "PATCH", {
      feedback: nextFeedback,
    });
    if (!data) return;
    setDrafts((rows) =>
      rows.map((row) =>
        row.id === item.id ? { ...row, feedback: nextFeedback } : row,
      ),
    );
    setMessage("Style feedback saved.");
  }

  function target(channel: OutreachChannel) {
    if (channel === "email" || channel === "whatsapp")
      return contacts.find(
        (item) => item.verified && item.channel === channel,
      );
    return links.find(
      (item) =>
        item.type === channel && item.verificationStatus === "confirmed",
    );
  }

  async function openComposer(item: Draft, followUp = false) {
    const destination = target(item.channel);
    if (!destination)
      return setMessage(`Verify or confirm a ${item.channel} target first.`);
    const subject = followUp ? item.followUpSubject : item.subject;
    const body = followUp ? item.followUpBody : item.body;
    if (item.channel === "instagram" || item.channel === "linkedin") {
      if (!("url" in destination))
        return setMessage(`Confirm a ${item.channel} profile first.`);
      await navigator.clipboard.writeText(body ?? "");
      window.open(destination.url, "_blank", "noopener,noreferrer");
      setMessage(
        `Message copied and ${item.channel} opened. Send it manually, then confirm here.`,
      );
      return;
    }
    if (!("value" in destination))
      return setMessage(`Verify a ${item.channel} contact first.`);
    const url =
      item.channel === "email"
        ? `mailto:${encodeURIComponent(destination.value)}?subject=${encodeURIComponent(subject ?? "")}&body=${encodeURIComponent(body ?? "")}`
        : `https://wa.me/${destination.value.replace(/\D/g, "")}?text=${encodeURIComponent(body ?? "")}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function markSent(item: Draft) {
    const data = await request(`/api/outreach/${item.id}/mark-sent`);
    if (data) {
      setDrafts((rows) =>
        rows.map((row) =>
          row.id === item.id
            ? {
                ...row,
                status: "sent",
                sentAt: data.sentAt,
                followUpDueAt: data.followUpDueAt,
              }
            : row,
        ),
      );
      setMessage("Outreach recorded and follow-up scheduled.");
    }
  }

  async function prepareFollowUp(item: Draft) {
    const data = await request(`/api/outreach/${item.id}/follow-up`);
    if (data) {
      setDrafts((rows) =>
        rows.map((row) =>
          row.id === item.id
            ? { ...row, followUpSubject: data.subject, followUpBody: data.body }
            : row,
        ),
      );
    }
  }

  async function saveFollowUp(item: Draft) {
    if (
      await request(`/api/outreach/${item.id}/follow-up`, "POST", {
        subject: item.followUpSubject,
        body: item.followUpBody,
      })
    ) {
      setMessage("Follow-up saved.");
    }
  }

  async function markFollowUpSent(item: Draft) {
    const data = await request(`/api/outreach/${item.id}/mark-follow-up-sent`);
    if (data) {
      setDrafts((rows) =>
        rows.map((row) =>
          row.id === item.id
            ? { ...row, followUpSentAt: data.sentAt, followUpDueAt: null }
            : row,
        ),
      );
      setMessage("Follow-up recorded.");
    }
  }

  async function updateLead(body: object) {
    if (await request(`/api/leads/${lead.id}`, "PATCH", body))
      refresh("Lead updated.");
  }

  async function addContact() {
    if (
      await request(`/api/leads/${lead.id}`, "PATCH", {
        contact: { ...contactForm, verified: true, isPrimary: true },
      })
    ) {
      refresh("Verified contact saved.");
    }
  }

  async function verifyContact(contact: Contact) {
    if (
      await request(`/api/leads/${lead.id}`, "PATCH", {
        contact: { ...contact, verified: true, isPrimary: true },
      })
    ) {
      setContacts((rows) =>
        rows.map((row) =>
          row.id === contact.id
            ? { ...row, verified: true, isPrimary: true }
            : row,
        ),
      );
      setMessage("Contact verified.");
    }
  }

  function checkWhatsApp(contact: Contact) {
    const phone = contact.value.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
    setCheckedWhatsAppContact(contact.id);
    setMessage(
      "WhatsApp opened without a message. Confirm only if the business profile is available.",
    );
  }

  async function confirmWhatsApp(contact: Contact) {
    if (
      await request(`/api/leads/${lead.id}`, "PATCH", {
        contact: {
          channel: "whatsapp",
          value: contact.value,
          sourceUrl: contact.sourceUrl,
          verified: true,
          isPrimary: true,
        },
      })
    )
      refresh("WhatsApp contact confirmed and ready for outreach.");
  }

  async function enrichPublicPresence() {
    const data = await request(`/api/leads/${lead.id}/enrich`);
    if (!data) return;
    setLinks(data.links);
    setMessage(
      data.cached
        ? "Showing today’s saved public-web results."
        : `${data.links.length} public website and profile candidates found.`,
    );
  }

  async function reviewBusinessLink(
    link: BusinessLink,
    action: "confirm" | "reject",
  ) {
    const data = await request(
      `/api/leads/${lead.id}/links/${link.id}`,
      "PATCH",
      { action },
    );
    if (!data) return;
    if (action === "confirm" && link.type === "website")
      return refresh(
        "Official website confirmed. Run the audit again to inspect it.",
      );
    setLinks((rows) =>
      rows
        .map((row) =>
          row.id === link.id
            ? { ...row, verificationStatus: data.link.verificationStatus }
            : row,
        )
        .filter((row) => row.verificationStatus !== "rejected"),
    );
    setMessage(
      action === "confirm"
        ? `${link.type} profile confirmed.`
        : "Candidate dismissed.",
    );
  }

  async function optOut() {
    if (
      confirm("Suppress this contact permanently?") &&
      (await request(`/api/leads/${lead.id}/opt-out`, "POST", {
        reason: "Contact requested no further messages",
      }))
    ) {
      refresh("Contact suppressed.");
    }
  }

  const defaultPackage = PACKAGES[lead.country as "NG" | "UK"][1];
  const [proposalForm, setProposalForm] = useState({
    title: initialProposal?.title ?? `${lead.name} website proposal`,
    content:
      initialProposal?.content ??
      `Findings\n\nBased on the website review, I recommend a focused rebuild.\n\nDeliverables\n\nResponsive website, clear contact actions, essential SEO setup and restricted staging preview.\n\nTimeline\n\n10 business days.\n\nPreview and payment terms\n\nYou can review the restricted preview and request agreed-scope corrections. Full payment is due after approval and before production handover.`,
    expiresAt: initialProposal?.expiresAt?.slice(0, 10) ?? "",
    packageName: initialOpportunity?.packageName ?? defaultPackage.name,
    valueMinor: initialOpportunity?.valueMinor ?? defaultPackage.price,
    previewUrl: initialOpportunity?.previewUrl ?? "",
    paymentReference: "",
  });

  async function saveProposal() {
    if (!opportunity) return;
    await request(`/api/opportunities/${opportunity.id}`, "PATCH", {
      packageName: proposalForm.packageName,
      valueMinor: Number(proposalForm.valueMinor),
      currency: defaultPackage.currency,
    });
    const data = await request(
      `/api/opportunities/${opportunity.id}/proposal`,
      "POST",
      {
        title: proposalForm.title,
        content: proposalForm.content,
        expiresAt: new Date(
          `${proposalForm.expiresAt}T23:59:59Z`,
        ).toISOString(),
      },
    );
    if (data) setMessage("Proposal saved for manual delivery.");
  }

  async function recordPreview() {
    if (!opportunity) return;
    const data = await request(
      `/api/opportunities/${opportunity.id}`,
      "PATCH",
      {
        previewUrl: proposalForm.previewUrl,
      },
    );
    if (data) {
      setOpportunity(data.opportunity);
      setMessage("Restricted preview recorded.");
    }
  }

  async function approvePreview() {
    if (
      opportunity &&
      (await request(`/api/opportunities/${opportunity.id}/preview-approved`))
    ) {
      refresh("Preview approved. Payment is now due.");
    }
  }

  async function recordPayment() {
    if (
      opportunity &&
      (await request(`/api/opportunities/${opportunity.id}/payment`, "POST", {
        amountMinor: Number(proposalForm.valueMinor),
        currency: defaultPackage.currency,
        reference: proposalForm.paymentReference || undefined,
      }))
    ) {
      refresh("Payment recorded. Handover unlocked.");
    }
  }

  const selectedDraft = drafts[0];
  const ukBasisReady =
    lead.country !== "UK" ||
    Boolean(
      lead.outreachBasisReviewedAt &&
        ((lead.outreachBasis === "corporate_b2b" &&
          lead.legalForm === "corporate") ||
          ((lead.outreachBasis === "consent" ||
            lead.outreachBasis === "solicited_request") &&
            lead.outreachBasisNote?.trim())),
    );
  const channelOptions = OUTREACH_CHANNELS.map((channel) => {
    const destination = target(channel);
    const reason = !canDraft
      ? "Run an audit first"
      : lead.suppressed
        ? "Lead is suppressed"
        : !ukBasisReady
          ? "Record a valid UK outreach basis"
          : !destination
            ? channel === "instagram" || channel === "linkedin"
              ? `Confirm the business-owned ${channel} profile`
              : `Verify a ${channel} contact`
            : null;
    return { channel, available: !reason, reason };
  });

  return (
    <div id="workflow" className="workflow-shell">
      <div className="workflow-stepper">
        {workflow.map((item, index) => {
          const Icon = item.icon;
          const selected = active === item.id;
          const done = workflow.findIndex((row) => row.id === active) > index;
          return (
            <button
              key={item.id}
              className={`${selected ? "active" : ""} ${done ? "done" : ""}`}
              onClick={() => setActive(item.id)}
            >
              <span>{done ? <Check /> : <Icon />}</span>
              {item.label}
              <i />
            </button>
          );
        })}
      </div>

      {message && (
        <div
          className={`workflow-toast ${messageClosing ? "closing" : ""}`}
          role="status"
          aria-live="polite"
        >
          {busy ? <LoaderCircle className="spin" /> : <CheckCircle2 />}
          <span>{message}</span>
          <button
            type="button"
            data-testid="close-notification"
            aria-label="Close notification"
            onClick={dismissMessage}
          >
            <X />
          </button>
        </div>
      )}

      <div className="workflow-grid">
        <main className="stage-main">
          <div className="stage-heading">
            <div>
              <span className="section-kicker">Lead workflow</span>
              <h1>{workflow.find((item) => item.id === active)?.label}</h1>
              <p>{stageDescription(active)}</p>
            </div>
            <select
              aria-label="Pipeline stage"
              value={lead.stage}
              onChange={(e) => setLead({ ...lead, stage: e.target.value })}
            >
              {PIPELINE_STAGES.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
          </div>

          {active === "audit" && (
            <div className="stage-stack">
              <section className="surface-panel audit-panel">
                <div className="panel-title">
                  <span>
                    <ScanSearch />
                  </span>
                  <div>
                    <h3>Website audit</h3>
                    <p>{auditSummary ?? "No audit has been run yet."}</p>
                  </div>
                  <button onClick={audit} disabled={busy}>
                    Run audit
                  </button>
                </div>
                <div className="evidence-list">
                  {evidence.map((item) => (
                    <article key={item.id}>
                      <span className={`severity ${item.severity}`}>
                        {item.severity}
                      </span>
                      <div>
                        <b>{item.title}</b>
                        <p>{item.evidence}</p>
                        <small>{item.recommendation}</small>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
              <AiLoading />
            </div>
          )}

          {active === "contact" && (
            <div className="stage-stack">
              <div className="two-panel">
                <section className="surface-panel">
                  <div className="panel-title">
                    <span>
                      <ShieldCheck />
                    </span>
                    <div>
                      <h3>Verified contacts</h3>
                      <p>Only verified public business details can be used.</p>
                    </div>
                  </div>
                  <div className="contact-cards">
                    {contacts.length === 0 && (
                      <div className="contact-empty-state" role="status">
                        <ShieldCheck />
                        <div>
                          <b>No public contact details found</b>
                          <p>
                            The audit checked the website and its public contact
                            pages but did not find an email, phone number, or
                            WhatsApp link. Add one manually only if you can cite
                            its public source.
                          </p>
                        </div>
                      </div>
                    )}
                    {contacts.map((contact) => (
                      <article key={contact.id}>
                        <div>
                          <small>{contact.channel}</small>
                          <b>{contact.value}</b>
                          <a
                            href={contact.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View source <ExternalLink />
                          </a>
                        </div>
                        {contact.channel === "phone" ? (
                          <div className="contact-check-actions">
                            <span className="whatsapp-unknown">
                              WhatsApp unknown
                            </span>
                            <button onClick={() => checkWhatsApp(contact)}>
                              Check WhatsApp
                            </button>
                            {checkedWhatsAppContact === contact.id && (
                              <button
                                className="confirm-whatsapp"
                                onClick={() => confirmWhatsApp(contact)}
                              >
                                I found it
                              </button>
                            )}
                          </div>
                        ) : contact.verified ? (
                          <span className="verified">
                            <Check />
                            {contact.channel === "whatsapp"
                              ? contact.verificationMethod ===
                                "published_whatsapp"
                                ? "WhatsApp link found"
                                : "WhatsApp confirmed"
                              : "Verified"}
                          </span>
                        ) : (
                          <button onClick={() => verifyContact(contact)}>
                            Verify
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                  <div className="inline-form">
                    <select
                      value={contactForm.channel}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          channel: e.target.value as Contact["channel"],
                        })
                      }
                    >
                      <option>email</option>
                      <option>whatsapp</option>
                      <option>phone</option>
                    </select>
                    <input
                      placeholder="Contact value"
                      value={contactForm.value}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          value: e.target.value,
                        })
                      }
                    />
                    <input
                      placeholder="Public source URL"
                      value={contactForm.sourceUrl}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          sourceUrl: e.target.value,
                        })
                      }
                    />
                    <button onClick={addContact}>
                      <Plus />
                      Add verified
                    </button>
                  </div>
                </section>
                <section className="surface-panel">
                  <div className="panel-title">
                    <span>
                      <Globe2 />
                    </span>
                    <div>
                      <h3>Compliance review</h3>
                      <p>
                        Required before outreach to uncertain UK businesses.
                      </p>
                    </div>
                  </div>
                  <label className="field-label">
                    Legal form
                    <select
                      value={lead.legalForm}
                      onChange={(e) =>
                        setLead({
                          ...lead,
                          legalForm: e.target.value as Lead["legalForm"],
                        })
                      }
                    >
                      <option value="unknown">Unknown</option>
                      <option value="corporate">Corporate</option>
                      <option value="sole_trader">Sole trader</option>
                    </select>
                  </label>
                  <label className="review-check">
                    <input
                      type="checkbox"
                      checked={lead.complianceReviewed}
                      onChange={(e) =>
                        setLead({
                          ...lead,
                          complianceReviewed: e.target.checked,
                        })
                      }
                    />
                    <span>
                      <b>Manual review completed</b>
                      <small>
                        I checked the legal form and public contact source.
                      </small>
                    </span>
                  </label>
                  {lead.country === "UK" && (
                    <>
                      <label className="field-label">
                        Outreach basis
                        <select
                          value={lead.outreachBasis ?? ""}
                          onChange={(e) =>
                            setLead({
                              ...lead,
                              outreachBasis: (e.target.value || null) as Lead["outreachBasis"],
                            })
                          }
                        >
                          <option value="">Not recorded</option>
                          <option value="corporate_b2b">
                            Confirmed corporate B2B
                          </option>
                          <option value="consent">Documented consent</option>
                          <option value="solicited_request">
                            Solicited request
                          </option>
                        </select>
                      </label>
                      {(lead.outreachBasis === "consent" ||
                        lead.outreachBasis === "solicited_request") && (
                        <label className="field-label">
                          Basis note
                          <textarea
                            value={lead.outreachBasisNote ?? ""}
                            placeholder="Where and when the consent or request was recorded"
                            onChange={(e) =>
                              setLead({
                                ...lead,
                                outreachBasisNote: e.target.value,
                              })
                            }
                          />
                        </label>
                      )}
                      <small>
                        Social DMs count as electronic marketing. See the{" "}
                        <a
                          href="https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/business-to-business-marketing/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          ICO B2B guidance
                        </a>
                        .
                      </small>
                    </>
                  )}
                  <button
                    className="primary-action"
                    onClick={() =>
                      updateLead({
                        legalForm: lead.legalForm,
                        complianceReviewed: lead.complianceReviewed,
                        outreachBasis: lead.outreachBasis,
                        outreachBasisNote: lead.outreachBasisNote,
                      })
                    }
                  >
                    Save compliance review
                  </button>
                </section>
              </div>
              <section className="surface-panel presence-panel">
                <div className="panel-title presence-title">
                  <span>
                    <Search />
                  </span>
                  <div>
                    <h3>Public presence</h3>
                    <p>
                      Find an official website and business-owned social
                      profiles beyond the Google listing.
                    </p>
                  </div>
                  <button
                    className="secondary-action"
                    onClick={enrichPublicPresence}
                    disabled={busy}
                  >
                    <Search />
                    {busy ? "Searching…" : "Search public web"}
                  </button>
                </div>
                <div className="presence-grid">
                  {links.filter(
                    (link) => link.verificationStatus !== "rejected",
                  ).length === 0 && (
                    <div className="presence-empty">
                      <Globe2 />
                      <div>
                        <b>No additional profiles collected yet</b>
                        <p>
                          Run the website audit or search the public web. Every
                          result remains a candidate until its evidence is
                          confirmed.
                        </p>
                      </div>
                    </div>
                  )}
                  {links
                    .filter((link) => link.verificationStatus !== "rejected")
                    .map((link) => {
                      const LinkIcon = businessLinkIcons[link.type];
                      return (
                        <article key={link.id} className="presence-card">
                          <div className="presence-icon">
                            <LinkIcon />
                          </div>
                          <div className="presence-copy">
                            <div>
                              <b>{link.type}</b>
                              <span>{link.confidence}% match</span>
                            </div>
                            <a href={link.url} target="_blank" rel="noreferrer">
                              {new URL(link.url).hostname.replace(/^www\./, "")}
                              <ExternalLink />
                            </a>
                            <small>{link.evidence}</small>
                          </div>
                          <div className="presence-actions">
                            {link.verificationStatus === "confirmed" ? (
                              <span className="verified">
                                <Check /> Confirmed
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() =>
                                    reviewBusinessLink(link, "confirm")
                                  }
                                >
                                  Confirm
                                </button>
                                <button
                                  className="dismiss-link"
                                  onClick={() =>
                                    reviewBusinessLink(link, "reject")
                                  }
                                >
                                  Dismiss
                                </button>
                              </>
                            )}
                          </div>
                        </article>
                      );
                    })}
                </div>
              </section>
            </div>
          )}

          {active === "pitch" && (
            <div className="stage-stack">
              <div className="two-panel compact-panels">
                <InfoPanel title="Verified contact" icon={<ShieldCheck />}>
                  {contacts.filter((item) => item.verified).length === 0 && (
                    <p>
                      <b>No verified contact available</b>
                      <small>
                        Find and verify a public business contact first.
                      </small>
                    </p>
                  )}
                  {contacts
                    .filter((item) => item.verified)
                    .slice(0, 2)
                    .map((item) => (
                      <p key={item.id}>
                        <small>{item.channel}</small>
                        <b>{item.value}</b>
                      </p>
                    ))}
                </InfoPanel>
                <InfoPanel title="Evidence" icon={<ScanSearch />}>
                  <b>{evidence[0]?.title ?? "Run an audit first"}</b>
                  <div className="evidence-chips">
                    {evidence.slice(0, 3).map((item) => (
                      <span key={item.id}>{item.title}</span>
                    ))}
                  </div>
                </InfoPanel>
              </div>
              <section className="surface-panel pitch-editor">
                <div className="panel-title">
                  <span><Sparkles /></span>
                  <div>
                    <h3>Choose a pitch direction</h3>
                    <p>
                      Generate three evidence-backed options, then select one
                      to edit.
                    </p>
                  </div>
                  {generation && (
                    <span className="draft-badge">
                      {generation.usedFallback ? "Local fallback" : "Gemini"}
                    </span>
                  )}
                </div>
                <div className="pitch-channel-grid">
                  {channelOptions.map((option) => (
                    <button
                      key={option.channel}
                      disabled={!option.available || busy}
                      title={option.reason ?? undefined}
                      onClick={() => draft(option.channel)}
                    >
                      {option.channel === "email" ? (
                        <Mail />
                      ) : option.channel === "instagram" ? (
                        <Camera />
                      ) : option.channel === "linkedin" ? (
                        <BriefcaseBusiness />
                      ) : (
                        <MessageCircle />
                      )}
                      <span>
                        <b>
                          {option.channel.charAt(0).toUpperCase() +
                            option.channel.slice(1)}
                        </b>
                        <small>
                          {option.reason ?? "Generate three variants"}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
                {busy && <AiLoading />}
                {variants.length > 0 && (
                  <div className="pitch-variant-grid">
                    {variants.map((variant) => (
                      <article key={variant.id} className="pitch-variant-card">
                        <div className="pitch-variant-heading">
                          <span>{variant.label}</span>
                          <small>{variant.body.length} characters</small>
                        </div>
                        {variant.subject && <h4>{variant.subject}</h4>}
                        <p>{variant.body}</p>
                        <div className="evidence-chips">
                          {variant.evidenceCodes.map((code) => (
                            <span key={code}>
                              {evidence.find((item) => item.code === code)
                                ?.title ?? code.replaceAll("_", " ")}
                            </span>
                          ))}
                        </div>
                        <button
                          className="primary-action"
                          disabled={Boolean(
                            selectedDraft?.sourceVariantId === variant.id,
                          )}
                          onClick={() => selectVariant(variant)}
                        >
                          <Check />
                          {selectedDraft?.sourceVariantId === variant.id
                            ? "Selected"
                            : "Use this version"}
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="surface-panel pitch-editor">
                <div className="panel-title">
                  <span>
                    {selectedDraft?.channel === "email" ? (
                      <Mail />
                    ) : selectedDraft?.channel === "instagram" ? (
                      <Camera />
                    ) : selectedDraft?.channel === "linkedin" ? (
                      <BriefcaseBusiness />
                    ) : (
                      <MessageCircle />
                    )}
                  </span>
                  <div>
                    <h3>
                      {selectedDraft
                        ? `Edit the ${selectedDraft.channel} pitch`
                        : "No pitch selected yet"}
                    </h3>
                    <p>Review every word before opening the messaging app.</p>
                  </div>
                  <span className="draft-badge">Manual send</span>
                </div>
                {selectedDraft ? (
                  <>
                    <input
                      className="subject-input"
                      value={selectedDraft.subject ?? ""}
                      hidden={selectedDraft.subject === null}
                      onChange={(e) =>
                        setDrafts((rows) =>
                          rows.map((row) =>
                            row.id === selectedDraft.id
                              ? { ...row, subject: e.target.value }
                              : row,
                          ),
                        )
                      }
                    />
                    <textarea
                      value={selectedDraft.body}
                      disabled={Boolean(selectedDraft.sentAt)}
                      onChange={(e) =>
                        setDrafts((rows) =>
                          rows.map((row) =>
                            row.id === selectedDraft.id
                              ? { ...row, body: e.target.value }
                              : row,
                          ),
                        )
                      }
                    />
                    <div className="editor-footer">
                      <span>{selectedDraft.body.length} characters</span>
                      <div>
                        <button
                          className={
                            selectedDraft.feedback === "up" ? "active" : ""
                          }
                          aria-label="Good pitch"
                          onClick={() => rateDraft(selectedDraft, "up")}
                        >
                          <ThumbsUp />
                        </button>
                        <button
                          className={
                            selectedDraft.feedback === "down" ? "active" : ""
                          }
                          aria-label="Poor pitch"
                          onClick={() => rateDraft(selectedDraft, "down")}
                        >
                          <ThumbsDown />
                        </button>
                        {!selectedDraft.sentAt && (
                          <button onClick={() => saveDraft(selectedDraft)}>
                            <Save />
                            Save
                          </button>
                        )}
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(selectedDraft.body)
                          }
                        >
                          <Copy />
                          Copy
                        </button>
                        <button
                          className="primary-action"
                          onClick={() => openComposer(selectedDraft)}
                        >
                          <MessageCircle />
                          {selectedDraft.channel === "instagram" ||
                          selectedDraft.channel === "linkedin"
                            ? `Copy and open ${selectedDraft.channel}`
                            : `Open ${selectedDraft.channel}`}
                          <ChevronDown />
                        </button>
                        {!selectedDraft.sentAt && (
                          <button onClick={() => markSent(selectedDraft)}>
                            <Check />I sent this
                          </button>
                        )}
                      </div>
                    </div>
                    {selectedDraft.sentAt && (
                      <FollowUp
                        item={selectedDraft}
                        setDrafts={setDrafts}
                        prepare={prepareFollowUp}
                        save={saveFollowUp}
                        open={openComposer}
                        sent={markFollowUpSent}
                      />
                    )}
                  </>
                ) : (
                  <div className="pitch-empty">
                    <MessageCircle />
                    <h3>Select one of the three variants</h3>
                    <p>
                      The selected version becomes an editable outreach draft.
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}

          {active === "proposal" && (
            <section className="surface-panel proposal-editor">
              <div className="panel-title">
                <span>
                  <FileText />
                </span>
                <div>
                  <h3>Website rescue proposal</h3>
                  <p>Editable scope, price and trust-first terms.</p>
                </div>
              </div>
              <div className="form-grid-modern">
                <label>
                  Proposal title
                  <input
                    value={proposalForm.title}
                    onChange={(e) =>
                      setProposalForm({
                        ...proposalForm,
                        title: e.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Package
                  <select
                    value={proposalForm.packageName}
                    onChange={(e) =>
                      setProposalForm({
                        ...proposalForm,
                        packageName: e.target.value,
                      })
                    }
                  >
                    {PACKAGES[lead.country as "NG" | "UK"].map((item) => (
                      <option key={item.name}>{item.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Price ({defaultPackage.currency})
                  <input
                    type="number"
                    value={proposalForm.valueMinor}
                    onChange={(e) =>
                      setProposalForm({
                        ...proposalForm,
                        valueMinor: Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  Expires
                  <input
                    type="date"
                    value={proposalForm.expiresAt}
                    onChange={(e) =>
                      setProposalForm({
                        ...proposalForm,
                        expiresAt: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="wide">
                  Proposal content
                  <textarea
                    value={proposalForm.content}
                    onChange={(e) =>
                      setProposalForm({
                        ...proposalForm,
                        content: e.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="panel-actions">
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `${proposalForm.title}\n\n${proposalForm.content}`,
                    )
                  }
                >
                  <Copy />
                  Copy
                </button>
                <button onClick={() => window.print()}>
                  <FileText />
                  Print
                </button>
                <button className="primary-action" onClick={saveProposal}>
                  <Save />
                  Save proposal
                </button>
              </div>
            </section>
          )}

          {active === "preview" && (
            <section className="surface-panel focused-stage">
              <span className="stage-illustration">
                <Globe2 />
              </span>
              <h2>Share a restricted working preview</h2>
              <p>
                Let the customer inspect the agreed work without handing over
                production access, source files, credentials or ownership.
              </p>
              <label>
                Restricted preview URL
                <input
                  placeholder="https://preview.example.com"
                  value={proposalForm.previewUrl}
                  onChange={(e) =>
                    setProposalForm({
                      ...proposalForm,
                      previewUrl: e.target.value,
                    })
                  }
                />
              </label>
              <div>
                <button onClick={recordPreview}>Record preview</button>
                <button
                  className="primary-action"
                  disabled={
                    !opportunity?.previewUrl ||
                    Boolean(opportunity.previewApprovedAt)
                  }
                  onClick={approvePreview}
                >
                  <Check />
                  Customer approved preview
                </button>
              </div>
            </section>
          )}

          {active === "payment" && (
            <section className="surface-panel focused-stage">
              <span className="stage-illustration">
                <CircleDollarSign />
              </span>
              <h2>
                {opportunity?.paidAt
                  ? "Payment received"
                  : "Full payment before handover"}
              </h2>
              <p>
                {opportunity?.paidAt
                  ? "Production handover is unlocked."
                  : "Record external payment only after the customer approves the restricted preview."}
              </p>
              <div className="payment-total">
                <span>Amount due</span>
                <strong>
                  {defaultPackage.currency}{" "}
                  {Number(proposalForm.valueMinor).toLocaleString()}
                </strong>
              </div>
              <label>
                Payment reference
                <input
                  placeholder="Bank reference or receipt ID"
                  value={proposalForm.paymentReference}
                  onChange={(e) =>
                    setProposalForm({
                      ...proposalForm,
                      paymentReference: e.target.value,
                    })
                  }
                />
              </label>
              <button
                className="primary-action"
                disabled={
                  !opportunity?.previewApprovedAt || Boolean(opportunity.paidAt)
                }
                onClick={recordPayment}
              >
                <Check />
                Record full payment and unlock handover
              </button>
            </section>
          )}
        </main>

        <aside className="deal-rail">
          <section>
            <div className="rail-heading">
              <h3>Activity</h3>
              <span>Latest</span>
            </div>
            <div className="activity-line">
              {activities.length ? (
                activities.slice(0, 5).map((item) => (
                  <article key={item.id}>
                    <span>
                      <Check />
                    </span>
                    <div>
                      <b>{item.type.replaceAll("_", " ")}</b>
                      <p>{item.detail}</p>
                      <small>{new Date(item.createdAt).toLocaleString()}</small>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rail-empty">No activity recorded yet.</div>
              )}
            </div>
          </section>
          <section>
            <div className="rail-heading">
              <h3>Deal summary</h3>
              <button onClick={() => updateLead({ stage: lead.stage })}>
                Save stage
              </button>
            </div>
            <dl>
              <div>
                <dt>Business</dt>
                <dd>{lead.name}</dd>
              </div>
              <div>
                <dt>Market</dt>
                <dd>
                  {lead.city}, {lead.country}
                </dd>
              </div>
              <div>
                <dt>Opportunity score</dt>
                <dd>{lead.score}/100</dd>
              </div>
              <div>
                <dt>Estimated value</dt>
                <dd>
                  {defaultPackage.currency}{" "}
                  {Number(proposalForm.valueMinor).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt>Stage</dt>
                <dd>{lead.stage.replaceAll("_", " ")}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>
                  <a href={lead.sourceUrl} target="_blank" rel="noreferrer">
                    Public listing <ArrowUpRight />
                  </a>
                </dd>
              </div>
            </dl>
            <button className="danger-link" onClick={optOut}>
              <ShieldX />
              Permanently opt out
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function stageDescription(stage: WorkflowStage) {
  return {
    audit: "Confirm the opportunity with evidence from the public website.",
    contact: "Verify a safe public business contact before outreach.",
    pitch: "Start the conversation with a clear, personal message.",
    proposal: "Turn interest into a clear scope and price.",
    preview: "Deliver value through a restricted working preview.",
    payment: "Record approval and payment before handover.",
  }[stage];
}

function InfoPanel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-panel info-panel">
      <div className="panel-title">
        <span>{icon}</span>
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function AiLoading() {
  return (
    <section className="surface-panel ai-loading">
      <h3>
        <Sparkles />
        Suggested next angles
      </h3>
      <div>
        <i />
        <i />
        <i />
      </div>
      <small>Preparing evidence-backed suggestions…</small>
    </section>
  );
}

function FollowUp({
  item,
  setDrafts,
  prepare,
  save,
  open,
  sent,
}: {
  item: Draft;
  setDrafts: React.Dispatch<React.SetStateAction<Draft[]>>;
  prepare: (i: Draft) => void;
  save: (i: Draft) => void;
  open: (i: Draft, f: boolean) => void;
  sent: (i: Draft) => void;
}) {
  return (
    <div className="follow-up-box">
      <div>
        <b>Follow-up</b>
        <span>
          {item.followUpDueAt
            ? `Due ${new Date(item.followUpDueAt).toLocaleDateString()}`
            : "Reminder cancelled"}
        </span>
      </div>
      {!item.followUpBody ? (
        <button onClick={() => prepare(item)}>Prepare follow-up</button>
      ) : (
        <>
          <textarea
            value={item.followUpBody}
            onChange={(e) =>
              setDrafts((rows) =>
                rows.map((row) =>
                  row.id === item.id
                    ? { ...row, followUpBody: e.target.value }
                    : row,
                ),
              )
            }
          />
          <div>
            <button onClick={() => save(item)}>Save</button>
            <button onClick={() => open(item, true)}>
              Open {item.channel}
            </button>
            <button onClick={() => sent(item)}>I sent follow-up</button>
          </div>
        </>
      )}
    </div>
  );
}
