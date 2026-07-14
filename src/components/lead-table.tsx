"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ExternalLink,
  Search,
  ScanSearch,
  SlidersHorizontal,
} from "lucide-react";
type Lead = {
  id: string;
  name: string;
  category: string;
  country: string;
  city: string;
  score: number;
  stage: string;
  websiteUrl: string | null;
  campaignName: string | null;
  suppressed: boolean;
};
export function LeadTable({ leads, demo }: { leads: Lead[]; demo: boolean }) {
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState("all");
  const [stage, setStage] = useState("all");
  const [running, setRunning] = useState("");
  const [notice, setNotice] = useState("");
  const filtered = useMemo(
    () =>
      leads.filter(
        (lead) =>
          (!query ||
            `${lead.name} ${lead.city} ${lead.category}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (market === "all" || lead.country === market) &&
          (stage === "all" || lead.stage === stage),
      ),
    [leads, query, market, stage],
  );
  async function audit(id: string) {
    if (demo) return setNotice("Demo data is read-only.");
    setRunning(id);
    setNotice("");
    try {
      const response = await fetch(`/api/leads/${id}/audit`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNotice(`Audit complete: ${data.audit.score}/100`);
      setTimeout(() => location.reload(), 500);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Audit failed");
    } finally {
      setRunning("");
    }
  }
  return (
    <div className="lead-table-shell">
      <div className="table-toolbar">
        <label>
          <Search />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads…"
          />
        </label>
        <select value={market} onChange={(e) => setMarket(e.target.value)}>
          <option value="all">All markets</option>
          <option value="NG">Nigeria</option>
          <option value="UK">United Kingdom</option>
        </select>
        <select value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="all">All stages</option>
          {[...new Set(leads.map((lead) => lead.stage))].map((item) => (
            <option key={item} value={item}>
              {item.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button className="filter-button">
          <SlidersHorizontal />
          More filters
        </button>
      </div>
      {notice && <div className="inline-notice">{notice}</div>}
      <div className="table-scroll">
        <table className="lead-table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Market</th>
              <th>Opportunity score</th>
              <th>Stage</th>
              <th>Campaign</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <div className="lead-name-cell">
                    <span>{lead.name.slice(0, 2).toUpperCase()}</span>
                    <div>
                      <Link href={`/leads/${lead.id}`}>{lead.name}</Link>
                      <small>{lead.category.replaceAll("_", " ")}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <b className="country-pill">{lead.country}</b>
                  {lead.city}
                </td>
                <td>
                  <div className="score-cell">
                    <b>{lead.score}</b>
                    <span>
                      <i style={{ width: `${lead.score}%` }} />
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`status-pill status-${lead.stage}`}>
                    {lead.stage.replaceAll("_", " ")}
                  </span>
                </td>
                <td>{lead.campaignName}</td>
                <td>
                  <div className="table-actions">
                    <button
                      onClick={() => audit(lead.id)}
                      disabled={running === lead.id}
                      aria-label={`Audit ${lead.name}`}
                    >
                      <ScanSearch />
                    </button>
                    {lead.websiteUrl && (
                      <a
                        href={lead.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${lead.name} website`}
                      >
                        <ExternalLink />
                      </a>
                    )}
                    <Link
                      href={`/leads/${lead.id}`}
                      aria-label={`Review ${lead.name}`}
                    >
                      <ArrowUpRight />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="empty-table">
            <Search />
            <b>No matching leads</b>
            <span>Try a different search or filter.</span>
          </div>
        )}
      </div>
    </div>
  );
}
