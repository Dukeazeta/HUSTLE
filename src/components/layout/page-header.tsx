import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import { countryName } from "@/lib/markets";
import styles from "./page-header.module.css";

export type LeadHeaderContext = {
  name: string;
  category: string;
  city: string;
  country: string;
  score: number;
  stage: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  lead,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  lead?: LeadHeaderContext;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.primaryRow}>
        <div className={styles.copy}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>

      {lead && <LeadContext lead={lead} />}
    </header>
  );
}

function LeadContext({ lead }: { lead: LeadHeaderContext }) {
  return (
    <div className={styles.leadContext} aria-label="Lead summary">
      <span className={styles.leadGlyph} aria-hidden="true">
        {lead.name.slice(0, 2).toUpperCase()}
      </span>
      <div className={styles.leadIdentity}>
        <strong>{lead.name}</strong>
        <span>{lead.category.replaceAll("_", " ")}</span>
      </div>
      <span className={styles.contextItem}>
        <MapPin aria-hidden="true" />
        {lead.city}, {countryName(lead.country)}
      </span>
      <span className={styles.score}>Score {lead.score}/100</span>
      <span className={styles.stage}>{lead.stage.replaceAll("_", " ")}</span>
    </div>
  );
}
