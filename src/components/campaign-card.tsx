"use client";
import { useState } from "react";
import { MapPin, Play } from "lucide-react";

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
  const [message, setMessage] = useState("");
  async function search() {
    if (demo)
      return setMessage(
        "Connect Turso and Google Places to run this campaign.",
      );
    setBusy(true);
    const response = await fetch(`/api/campaigns/${campaign.id}/search`, {
      method: "POST",
    });
    const data = await response.json();
    setBusy(false);
    setMessage(
      response.ok
        ? `${data.imported} imported · ${data.duplicates} duplicates`
        : data.error,
    );
    if (response.ok) setTimeout(() => location.reload(), 900);
  }
  return (
    <article className="campaign-card">
      <div className="campaign-top">
        <div className={`market-flag ${campaign.country.toLowerCase()}`}>
          {campaign.country}
        </div>
        <span className="status-dot">{campaign.status}</span>
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
      <button className="secondary-button" onClick={search} disabled={busy}>
        <Play size={15} />
        {busy ? "Searching…" : "Run search"}
      </button>
      {message && <small className="inline-message">{message}</small>}
    </article>
  );
}
