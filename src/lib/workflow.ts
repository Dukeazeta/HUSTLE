import { PIPELINE_STAGES, type PipelineStage } from "./constants";

export const CLOSED_STAGES = new Set<PipelineStage>([
  "won",
  "lost",
  "do_not_contact",
]);
export const REMINDER_CANCEL_STAGES = new Set<PipelineStage>([
  "replied",
  "lost",
  "won",
  "do_not_contact",
]);

export function isPipelineStage(value: string): value is PipelineStage {
  return (PIPELINE_STAGES as readonly string[]).includes(value);
}

export function preserveStageAfterAudit(current: string, score: number) {
  const currentIndex = PIPELINE_STAGES.indexOf(current as PipelineStage);
  const auditStage: PipelineStage = score >= 60 ? "qualified" : "audited";
  const auditIndex = PIPELINE_STAGES.indexOf(auditStage);
  return currentIndex > auditIndex ? current : auditStage;
}

export function canTransition(
  current: PipelineStage,
  next: PipelineStage,
  reopen = false,
) {
  if (current === next) return true;
  if (CLOSED_STAGES.has(current)) return reopen;
  if (next === "lost" || next === "do_not_contact") return true;
  return PIPELINE_STAGES.indexOf(next) >= PIPELINE_STAGES.indexOf(current);
}

export function buildFollowUp(
  originalBody: string,
  channel: "email" | "whatsapp",
) {
  const firstUsefulLine = originalBody
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 25 && !/^hi\b/i.test(line));
  const context =
    firstUsefulLine?.slice(0, 150) ?? "the website note I sent a few days ago";
  return {
    subject: channel === "email" ? "Following up on my website note" : null,
    body: `Hi, just following up on my earlier note about ${context.charAt(0).toLowerCase()}${context.slice(1)}\n\nWould it be useful if I sent a simple outline of what I would change? No worries if the timing is not right.`,
  };
}
