"use client";

import { useState } from "react";
import { MapPin, Play, Square, Trash2 } from "lucide-react";

type Campaign = {
  id: string;
  name: string;
  country: string;
  city: string;
  category: string;
  status: string;
  resultLimit: number;
  spentMinor: number;
  budgetMinor: number;
};

export function CampaignCard({
  campaign,
  demo,
}: {
  campaign: Campaign;
  demo: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(campaign.status);
  const [message, setMessage] = useState("");

  async function request(
    action: "search" | "stop" | "delete",
    init: RequestInit,
  ) {
    setBusy(true);
    setMessage("");
    try {
      const path =
        action === "search"
          ? `/api/campaigns/${campaign.id}/search`
          : `/api/campaigns/${campaign.id}`;
      const response = await fetch(path, init);
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? `Could not ${action} campaign`);
      return data;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function search() {
    if (demo)
      return setMessage(
        "Connect Turso and Google Places to run this campaign.",
      );
    const data = await request("search", { method: "POST" });
    if (!data) return;
    setMessage(`${data.imported} imported · ${data.duplicates} duplicates`);
    setTimeout(() => location.reload(), 900);
  }

  async function stop() {
    if (
      !window.confirm(
        "Stop this campaign? Its existing leads and history will be preserved.",
      )
    )
      return;
    const data = await request("stop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop" }),
    });
    if (!data) return;
    setStatus("complete");
    setMessage("Campaign stopped. Existing leads were preserved.");
  }

  async function remove() {
    if (
      !window.confirm(
        `Permanently delete “${campaign.name}” and all of its leads, audits, drafts, and history? This cannot be undone.`,
      )
    )
      return;
    const data = await request("delete", { method: "DELETE" });
    if (data) location.reload();
  }

  return (
    <article className="campaign-card">
      <div className="campaign-top">
        <div className={`market-flag ${campaign.country.toLowerCase()}`}>
          {campaign.country}
        </div>
        <span className="status-dot">
          {status === "complete" ? "stopped" : status}
        </span>
      </div>
      <h3>{campaign.name}</h3>
      <p>
        <MapPin size={14} /> {campaign.city} ·{" "}
        {campaign.category.replaceAll("_", " ")}
      </p>
      <div className="campaign-meta">
        <span>Up to {campaign.resultLimit} leads</span>
        <span>
          {campaign.budgetMinor
            ? `${campaign.spentMinor}/${campaign.budgetMinor} budget`
            : "No cap"}
        </span>
      </div>
      <div className="campaign-actions">
        <button
          className="secondary-button"
          onClick={search}
          disabled={busy || status !== "active"}
        >
          <Play size={15} />
          {busy ? "Working…" : status === "active" ? "Run search" : "Stopped"}
        </button>
        {status === "active" && (
          <button className="stop-button" onClick={stop} disabled={busy}>
            <Square size={14} />
            Stop
          </button>
        )}
        <button className="delete-button" onClick={remove} disabled={busy}>
          <Trash2 size={14} />
          Delete
        </button>
      </div>
      {message && <small className="inline-message">{message}</small>}
    </article>
  );
}
