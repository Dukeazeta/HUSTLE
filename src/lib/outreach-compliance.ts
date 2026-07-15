import type { OutreachChannel } from "./constants";

export type OutreachBasis =
  | "corporate_b2b"
  | "consent"
  | "solicited_request";

export function outreachBlockReason(input: {
  country: string;
  legalForm: string;
  complianceReviewed: boolean;
  outreachBasis: string | null;
  outreachBasisNote: string | null;
  outreachBasisReviewedAt: string | null;
  campaignComplianceReviewedAt: string | null;
  campaignComplianceNote: string | null;
  approvedChannels: string[];
  channel: OutreachChannel;
}) {
  if (input.country === "NG") return null;
  if (!input.campaignComplianceReviewedAt || !input.campaignComplianceNote?.trim())
    return "Complete the campaign compliance review before drafting";
  if (!input.approvedChannels.includes(input.channel))
    return `Approve ${input.channel} outreach in the campaign compliance review`;
  if (!input.complianceReviewed)
    return "Complete this lead's manual compliance review before drafting";
  if (!input.outreachBasis || !input.outreachBasisReviewedAt)
    return "Record the outreach basis before drafting";
  if (input.outreachBasis === "corporate_b2b") {
    return input.legalForm === "corporate"
      ? null
      : "Corporate B2B outreach requires a confirmed corporate legal form";
  }
  if (
    input.outreachBasis === "consent" ||
    input.outreachBasis === "solicited_request"
  ) {
    return input.outreachBasisNote?.trim()
      ? null
      : "Document the consent or solicited request before drafting";
  }
  return "The recorded outreach basis is not valid";
}
