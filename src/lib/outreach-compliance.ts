export type UkOutreachBasis =
  | "corporate_b2b"
  | "consent"
  | "solicited_request";

export function ukOutreachBlockReason(input: {
  country: string;
  legalForm: string;
  outreachBasis: string | null;
  outreachBasisNote: string | null;
  outreachBasisReviewedAt: string | null;
}) {
  if (input.country !== "UK") return null;
  if (!input.outreachBasis || !input.outreachBasisReviewedAt)
    return "Record the UK outreach basis before drafting";
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
  return "The recorded UK outreach basis is not valid";
}
