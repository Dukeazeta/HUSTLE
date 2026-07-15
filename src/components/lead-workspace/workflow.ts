import {
  CircleDollarSign,
  FileText,
  Globe2,
  MessageCircle,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";

export const WORKFLOW = [
  { id: "audit", label: "Audit", icon: ScanSearch },
  { id: "contact", label: "Contact", icon: ShieldCheck },
  { id: "pitch", label: "Pitch", icon: MessageCircle },
  { id: "proposal", label: "Proposal", icon: FileText },
  { id: "preview", label: "Preview", icon: Globe2 },
  { id: "payment", label: "Payment", icon: CircleDollarSign },
] as const;

export type WorkflowStage = (typeof WORKFLOW)[number]["id"];

export function initialWorkflow(stage: string): WorkflowStage {
  if (["discovered", "audited", "qualified"].includes(stage)) return "audit";
  if (["pitch_ready", "contacted", "replied", "meeting"].includes(stage)) {
    return "pitch";
  }
  if (stage === "proposal") return "proposal";
  if (stage === "preview") return "preview";
  if (["payment_due", "won"].includes(stage)) return "payment";
  return "contact";
}

export function stageDescription(stage: WorkflowStage) {
  return {
    audit: "Confirm the opportunity with evidence from the public website.",
    contact: "Verify a safe public business contact before outreach.",
    pitch: "Start the conversation with a clear, personal message.",
    proposal: "Turn interest into a clear scope and price.",
    preview: "Deliver value through a restricted working preview.",
    payment: "Record approval and payment before handover.",
  }[stage];
}
