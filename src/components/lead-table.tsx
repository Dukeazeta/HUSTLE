"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ExternalLink,
  LoaderCircle,
  RotateCcw,
  ScanSearch,
  Search,
  ShieldOff,
} from "lucide-react";
import { countryName } from "@/lib/markets";
import styles from "./lead-table.module.css";

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

type Notice = {
  tone: "info" | "success" | "error";
  message: string;
};

function readableLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function LeadTable({ leads, demo }: { leads: Lead[]; demo: boolean }) {
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState("all");
  const [stage, setStage] = useState("all");
  const [running, setRunning] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

  const markets = useMemo(
    () =>
      [...new Set(leads.map((lead) => lead.country))].sort((left, right) =>
        countryName(left).localeCompare(countryName(right)),
      ),
    [leads],
  );

  const stages = useMemo(
    () =>
      [...new Set(leads.map((lead) => lead.stage))].sort((left, right) =>
        readableLabel(left).localeCompare(readableLabel(right)),
      ),
    [leads],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return leads.filter((lead) => {
      const searchableText = [
        lead.name,
        lead.city,
        lead.category,
        lead.campaignName ?? "",
        countryName(lead.country),
      ]
        .join(" ")
        .toLocaleLowerCase();

      return (
        (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
        (market === "all" || lead.country === market) &&
        (stage === "all" || lead.stage === stage)
      );
    });
  }, [leads, market, query, stage]);

  const filtersActive =
    Boolean(query.trim()) || market !== "all" || stage !== "all";

  function clearFilters() {
    setQuery("");
    setMarket("all");
    setStage("all");
  }

  async function audit(id: string) {
    if (demo) {
      setNotice({ tone: "info", message: "Demo data is read-only." });
      return;
    }

    setRunning(id);
    setNotice(null);

    try {
      const response = await fetch(`/api/leads/${id}/audit`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Audit failed");
      }

      setNotice({
        tone: "success",
        message: `Audit complete: ${data.audit.score}/100`,
      });
      window.setTimeout(() => location.reload(), 500);
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Audit failed",
      });
    } finally {
      setRunning("");
    }
  }

  return (
    <section className={styles.shell} aria-label="Lead pipeline">
      <div className={styles.toolbar}>
        <label className={styles.searchField}>
          <span>Search leads</span>
          <span className={styles.searchControl}>
            <Search aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Business, city or campaign"
            />
          </span>
        </label>

        <label className={styles.filterField}>
          <span>Country</span>
          <select
            value={market}
            onChange={(event) => setMarket(event.target.value)}
          >
            <option value="all">All countries</option>
            {markets.map((country) => (
              <option key={country} value={country}>
                {countryName(country)}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filterField}>
          <span>Stage</span>
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value)}
          >
            <option value="all">All stages</option>
            {stages.map((item) => (
              <option key={item} value={item}>
                {readableLabel(item)}
              </option>
            ))}
          </select>
        </label>

        {filtersActive && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={clearFilters}
          >
            <RotateCcw aria-hidden="true" />
            Clear
          </button>
        )}
      </div>

      <div className={styles.summary} role="status" aria-live="polite">
        <span>
          Showing <strong>{filtered.length}</strong> of {leads.length} leads
        </span>
      </div>

      {notice && (
        <div
          className={styles.notice}
          data-tone={notice.tone}
          role={notice.tone === "error" ? "alert" : "status"}
        >
          {notice.message}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className={styles.list}>
          <div className={styles.listHeader} aria-hidden="true">
            <span>Business</span>
            <span>Market</span>
            <span>Score</span>
            <span>Stage</span>
            <span>Campaign</span>
            <span>Actions</span>
          </div>

          <ul>
            {filtered.map((lead) => {
              const isRunning = running === lead.id;

              return (
                <li
                  key={lead.id}
                  className={styles.leadRow}
                  data-suppressed={lead.suppressed || undefined}
                >
                  <div className={styles.businessCell}>
                    <span className={styles.monogram} aria-hidden="true">
                      {lead.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <div className={styles.businessHeading}>
                        <Link href={`/leads/${lead.id}`}>{lead.name}</Link>
                        {lead.suppressed && (
                          <span className={styles.suppressedBadge}>
                            <ShieldOff aria-hidden="true" />
                            Suppressed
                          </span>
                        )}
                      </div>
                      <span className={styles.category}>
                        {readableLabel(lead.category)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.dataCell}>
                    <span className={styles.mobileLabel}>Market</span>
                    <strong>{countryName(lead.country)}</strong>
                    <span>{lead.city}</span>
                  </div>

                  <div className={styles.dataCell}>
                    <span className={styles.mobileLabel}>Score</span>
                    <div
                      className={styles.score}
                      aria-label={`Opportunity score ${lead.score} out of 100`}
                    >
                      <strong>{lead.score}</strong>
                      <span aria-hidden="true">/100</span>
                    </div>
                  </div>

                  <div className={styles.dataCell}>
                    <span className={styles.mobileLabel}>Stage</span>
                    <span className={styles.stageBadge} data-stage={lead.stage}>
                      {readableLabel(lead.stage)}
                    </span>
                  </div>

                  <div className={styles.dataCell}>
                    <span className={styles.mobileLabel}>Campaign</span>
                    <span>{lead.campaignName ?? "Unassigned"}</span>
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.iconAction}
                      onClick={() => audit(lead.id)}
                      disabled={Boolean(running)}
                      aria-label={`Audit ${lead.name}`}
                      aria-busy={isRunning}
                    >
                      {isRunning ? (
                        <LoaderCircle className={styles.spin} aria-hidden="true" />
                      ) : (
                        <ScanSearch aria-hidden="true" />
                      )}
                      <span className={styles.actionLabel}>
                        {isRunning ? "Auditing" : "Audit"}
                      </span>
                    </button>

                    {lead.websiteUrl && (
                      <a
                        href={lead.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.iconAction}
                        aria-label={`Open ${lead.name} website in a new tab`}
                      >
                        <ExternalLink aria-hidden="true" />
                        <span className={styles.actionLabel}>Website</span>
                      </a>
                    )}

                    <Link
                      href={`/leads/${lead.id}`}
                      className={styles.reviewAction}
                      aria-label={`Review ${lead.name}`}
                    >
                      <span>Review</span>
                      <ArrowUpRight aria-hidden="true" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>
            <Search aria-hidden="true" />
          </span>
          <h2>{leads.length ? "No matching leads" : "No leads yet"}</h2>
          <p>
            {leads.length
              ? "Try another search or clear the current filters."
              : "Discovered businesses will appear here."}
          </p>
          {filtersActive && (
            <button type="button" onClick={clearFilters}>
              <RotateCcw aria-hidden="true" />
              Clear filters
            </button>
          )}
        </div>
      )}
    </section>
  );
}
