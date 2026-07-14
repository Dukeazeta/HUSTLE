import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarClock,
  Crosshair,
  MapPin,
  Radar,
  Sparkles,
  Target,
} from "lucide-react";

export function AppSidebar({
  qualified,
  lead,
  active = "command",
}: {
  qualified?: number;
  active?: "command" | "campaigns" | "leads" | "followups";
  lead?: {
    name: string;
    category: string;
    city: string;
    country: string;
    score: number;
    stage: string;
  };
}) {
  return (
    <aside className="app-sidebar">
      <Link href="/" className="app-brand">
        <span>
          <Sparkles size={18} />
        </span>
        <div>
          <b>HUSTLE</b>
          <small>Sales copilot</small>
        </div>
      </Link>
      <nav className="app-nav">
        <Link
          href="/"
          className={!lead && active === "command" ? "active" : ""}
        >
          <Radar />
          Command centre
        </Link>
        <Link
          href="/campaigns"
          className={active === "campaigns" ? "active" : ""}
        >
          <Target />
          Campaigns
        </Link>
        <Link href="/leads" className={active === "leads" ? "active" : ""}>
          <BriefcaseBusiness />
          Lead pipeline
        </Link>
        <Link
          href="/follow-ups"
          className={active === "followups" ? "active" : ""}
        >
          <CalendarClock />
          Follow-ups
        </Link>
      </nav>
      {lead ? (
        <div className="lead-sidebar-card">
          <div className="lead-monogram">
            {lead.name.slice(0, 2).toUpperCase()}
          </div>
          <span className="lead-type">
            {lead.category.replaceAll("_", " ")}
          </span>
          <h2>{lead.name}</h2>
          <p>
            <MapPin size={14} />
            {lead.city}, {lead.country}
          </p>
          <div
            className="score-ring"
            style={
              { "--score": `${lead.score * 3.6}deg` } as React.CSSProperties
            }
          >
            <div>
              <strong>{lead.score}</strong>
              <span>/100</span>
              <small>Opportunity score</small>
            </div>
          </div>
          <div className="lead-side-detail">
            <span>Stage</span>
            <b>{lead.stage.replaceAll("_", " ")}</b>
          </div>
          <div className="lead-side-detail">
            <span>Next action</span>
            <b>
              {lead.stage === "pitch_ready"
                ? "Send a personal pitch"
                : "Move this lead forward"}
            </b>
          </div>
          <a href="#workflow" className="lime-button">
            <Crosshair size={16} />
            Continue workflow
          </a>
        </div>
      ) : (
        <div className="mission-panel">
          <span>14-day mission</span>
          <strong>{qualified ?? 0}/100</strong>
          <p>qualified leads</p>
          <div className="mission-progress">
            <i style={{ width: `${Math.min(qualified ?? 0, 100)}%` }} />
          </div>
          <small>{Math.max(0, 100 - (qualified ?? 0))} remaining</small>
        </div>
      )}
    </aside>
  );
}
