import type { AuditFinding } from "./audit";

export function buildPitch(input: {
  businessName: string;
  country: string;
  channel: "email" | "whatsapp";
  findings: AuditFinding[];
  sourceUrl: string;
  pitchAngle?: string;
}) {
  const finding = input.findings[0];
  if (!finding)
    throw new Error("A pitch requires at least one verified finding");
  const issue = finding.evidence.replace(/\.$/, "").toLowerCase();
  const observation =
    input.pitchAngle?.trim() ||
    `I had a quick look at the website on your Google listing and noticed ${issue}.`;
  const offer =
    input.country === "NG"
      ? "I fix websites for small businesses. I can sketch out how I'd sort this one out, then you can decide if it is worth doing."
      : "I work on websites for small businesses. I can send a short note on how I'd fix it and what it would cost, if that would be useful.";
  return buildHumanizedPitch({
    businessName: input.businessName,
    channel: input.channel,
    observation,
    offer,
  });
}

export function buildHumanizedPitch(input: {
  businessName: string;
  channel: "email" | "whatsapp";
  observation: string;
  offer: string;
}) {
  const sender = process.env.OUTREACH_SENDER_NAME?.trim();
  const sections =
    input.channel === "whatsapp"
      ? [
          `Hi, I came across ${input.businessName} on Google Maps.`,
          input.observation,
          input.offer,
          "Would you be open to that? If not, no problem. I won't follow up.",
          sender,
        ]
      : [
          `Hi,\n\nI found ${input.businessName} through its Google listing. ${input.observation}`,
          input.offer,
          "Would it be useful if I sent that over? If not, just say and I won't follow up.",
          sender,
        ];
  const body = sections.filter(Boolean).join("\n\n");
  return {
    subject:
      input.channel === "email"
        ? `Quick note about ${input.businessName}'s website`
        : null,
    body,
  };
}

export function addBusinessDays(date: Date, days: number) {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (![0, 6].includes(result.getDay())) added++;
  }
  return result;
}
