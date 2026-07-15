import type { OutreachChannel } from "@/lib/constants";

export type Draft = {
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

export type PitchGeneration = {
  id: string;
  channel: OutreachChannel;
  usedFallback: boolean;
} | null;

export type PitchVariant = {
  id: string;
  generationId: string;
  label: "short" | "warm" | "specific";
  subject: string | null;
  body: string;
  evidenceCodes: string[];
};

export type Contact = {
  id: string;
  channel: "email" | "phone" | "whatsapp";
  value: string;
  sourceUrl: string;
  verified: boolean;
  isPrimary: boolean;
  verificationMethod: "unverified" | "manual" | "published_whatsapp";
};

export type BusinessLink = {
  id: string;
  type: "website" | "instagram" | "linkedin" | "facebook" | "x" | "tiktok";
  url: string;
  sourceUrl: string;
  verificationStatus: "candidate" | "confirmed" | "rejected";
  confidence: number;
  evidence: string;
};

export type Opportunity = {
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

export type Proposal = {
  id: string;
  title: string;
  content: string;
  expiresAt: string;
} | null;

export type Activity = {
  id: string;
  type: string;
  detail: string | null;
  createdAt: string;
};

export type Evidence = {
  id: string;
  code: string;
  severity: string;
  title: string;
  evidence: string;
  recommendation: string;
};

export type Lead = {
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

export type CampaignContext = {
  currency: string;
  landingPagePrice: number;
  completeWebsitePrice: number;
  bookingCataloguePrice: number;
  complianceNote: string | null;
  approvedChannels: string[];
  complianceReviewedAt: string | null;
};
