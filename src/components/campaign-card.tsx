"use client";

import { useCallback, useState } from "react";
import {
  AlertTriangle,
  MapPin,
  Play,
  Settings2,
  Square,
  Trash2,
} from "lucide-react";
import { OUTREACH_CHANNELS, type OutreachChannel } from "@/lib/constants";
import { CURRENCY_CODES, countryName } from "@/lib/markets";
import { Combobox } from "@/components/ui/combobox";
import { Dialog } from "@/components/ui/dialog";
import styles from "./campaign-card.module.css";

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
  currency: string;
  landingPagePrice: number;
  completeWebsitePrice: number;
  bookingCataloguePrice: number;
  complianceNote: string | null;
  complianceReference: string | null;
  approvedChannels: string[];
  complianceReviewedAt: string | null;
};

const currencyOptions = CURRENCY_CODES.map((code) => ({
  value: code,
  label: code,
}));

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
  const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");
  const [showSettings, setShowSettings] = useState(false);
  const [currency, setCurrency] = useState(campaign.currency);
  const [packagePrices, setPackagePrices] = useState({
    landingPageRescue: campaign.landingPagePrice,
    completeBusinessWebsite: campaign.completeWebsitePrice,
    bookingCatalogueWebsite: campaign.bookingCataloguePrice,
  });
  const [complianceNote, setComplianceNote] = useState(
    campaign.complianceNote ?? "",
  );
  const [complianceReference, setComplianceReference] = useState(
    campaign.complianceReference ?? "",
  );
  const [approvedChannels, setApprovedChannels] = useState<OutreachChannel[]>(
    campaign.approvedChannels.filter((channel): channel is OutreachChannel =>
      (OUTREACH_CHANNELS as readonly string[]).includes(channel),
    ),
  );

  const closeSettings = useCallback(() => setShowSettings(false), []);

  function demoNotice() {
    setNoticeTone("error");
    setMessage("Demo data is read-only. Connect the database to make changes.");
  }

  async function request(
    action: "search" | "stop" | "delete" | "update",
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
      if (!response.ok) {
        throw new Error(data.error ?? `Could not ${action} campaign`);
      }
      return data;
    } catch (error) {
      setNoticeTone("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function search() {
    if (demo) return demoNotice();
    const data = await request("search", { method: "POST" });
    if (!data) return;
    setNoticeTone("success");
    setMessage(`${data.imported} imported · ${data.duplicates} duplicates`);
    window.setTimeout(() => location.reload(), 900);
  }

  async function stop() {
    if (demo) return demoNotice();
    if (
      !window.confirm(
        "Stop this campaign? Its existing leads and history will be preserved.",
      )
    ) {
      return;
    }
    const data = await request("stop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop" }),
    });
    if (!data) return;
    setStatus("complete");
    setNoticeTone("success");
    setMessage("Campaign stopped. Existing leads were preserved.");
  }

  async function remove() {
    if (demo) return demoNotice();
    if (
      !window.confirm(
        `Permanently delete “${campaign.name}” and all of its leads, audits, drafts, and history? This cannot be undone.`,
      )
    ) {
      return;
    }
    const data = await request("delete", { method: "DELETE" });
    if (data) location.reload();
  }

  async function savePricing() {
    if (demo) return demoNotice();
    const data = await request("update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_pricing",
        currency,
        packagePrices,
      }),
    });
    if (!data) return;
    setNoticeTone("success");
    setMessage("Campaign pricing updated. Existing opportunities were unchanged.");
  }

  async function saveCompliance() {
    if (demo) return demoNotice();
    const data = await request("update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "review_compliance",
        complianceNote,
        complianceReference,
        approvedChannels,
      }),
    });
    if (!data) return;
    setNoticeTone("success");
    setMessage("Campaign compliance review recorded.");
  }

  function toggleChannel(channel: OutreachChannel) {
    setApprovedChannels((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel],
    );
  }

  return (
    <article className={styles.card}>
      <div className={styles.summary}>
        <span className={styles.marketCode}>{campaign.country}</span>
        <div className={styles.identity}>
          <div className={styles.titleLine}>
            <h3>{campaign.name}</h3>
            <span className={`${styles.status} ${styles[status]}`}>
              {status === "complete" ? "stopped" : status}
            </span>
          </div>
          <p>
            <MapPin aria-hidden="true" />
            {campaign.city}, {countryName(campaign.country)} ·{" "}
            {campaign.category.replaceAll("_", " ")}
          </p>
        </div>
        <dl className={styles.meta}>
          <div>
            <dt>Results</dt>
            <dd>Up to {campaign.resultLimit}</dd>
          </div>
          <div>
            <dt>Budget</dt>
            <dd>
              {campaign.budgetMinor
                ? `${campaign.spentMinor} / ${campaign.budgetMinor}`
                : "No cap"}
            </dd>
          </div>
          <div>
            <dt>Currency</dt>
            <dd>{currency}</dd>
          </div>
        </dl>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.settings}
            onClick={() => setShowSettings(true)}
          >
            <Settings2 aria-hidden="true" />
            Settings
          </button>
          <button
            type="button"
            className={styles.search}
            onClick={search}
            disabled={busy || status !== "active"}
          >
            <Play aria-hidden="true" />
            {busy ? "Working…" : status === "active" ? "Run search" : "Stopped"}
          </button>
        </div>
      </div>

      {message && (
        <p
          className={`${styles.notice} ${styles[noticeTone]}`}
          role={noticeTone === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      <Dialog
        open={showSettings}
        onClose={closeSettings}
        variant="drawer"
        eyebrow={`${campaign.city}, ${countryName(campaign.country)}`}
        title={campaign.name}
        description="Update future opportunity pricing and keep a record of your market review."
      >
        <div className={styles.drawerContent}>
          <section className={styles.settingsSection}>
            <div className={styles.sectionHeading}>
              <div>
                <h3>Proposal pricing</h3>
                <p>Changes apply only to opportunities created afterwards.</p>
              </div>
            </div>
            <Combobox
              label="Currency"
              value={currency}
              options={currencyOptions}
              onChange={setCurrency}
              required
            />
            <div className={styles.priceGrid}>
              <PriceField
                label="Landing page rescue"
                currency={currency}
                value={packagePrices.landingPageRescue}
                onChange={(value) =>
                  setPackagePrices((current) => ({
                    ...current,
                    landingPageRescue: value,
                  }))
                }
              />
              <PriceField
                label="Complete website"
                currency={currency}
                value={packagePrices.completeBusinessWebsite}
                onChange={(value) =>
                  setPackagePrices((current) => ({
                    ...current,
                    completeBusinessWebsite: value,
                  }))
                }
              />
              <PriceField
                label="Booking or catalogue"
                currency={currency}
                value={packagePrices.bookingCatalogueWebsite}
                onChange={(value) =>
                  setPackagePrices((current) => ({
                    ...current,
                    bookingCatalogueWebsite: value,
                  }))
                }
              />
            </div>
            <button
              type="button"
              className={styles.save}
              onClick={savePricing}
              disabled={busy}
            >
              Save pricing
            </button>
          </section>

          {campaign.country !== "NG" && (
            <section className={styles.settingsSection}>
              <div className={styles.sectionHeading}>
                <div>
                  <h3>Compliance review record</h3>
                  <p>
                    This is a human review note, not an automated declaration
                    that outreach is legally permitted.
                  </p>
                </div>
                <span
                  className={
                    campaign.complianceReviewedAt
                      ? styles.reviewed
                      : styles.notReviewed
                  }
                >
                  {campaign.complianceReviewedAt ? "Reviewed" : "Not reviewed"}
                </span>
              </div>
              <label className={styles.field}>
                Review note
                <textarea
                  value={complianceNote}
                  onChange={(event) => setComplianceNote(event.target.value)}
                  placeholder="Summarise the rules and restrictions you reviewed"
                />
              </label>
              <label className={styles.field}>
                Reference or source
                <input
                  value={complianceReference}
                  onChange={(event) => setComplianceReference(event.target.value)}
                  placeholder="Official guidance URL or adviser/source description"
                />
              </label>
              <fieldset className={styles.channels}>
                <legend>Approved outreach channels</legend>
                <div>
                  {OUTREACH_CHANNELS.map((channel) => (
                    <label key={channel}>
                      <input
                        type="checkbox"
                        checked={approvedChannels.includes(channel)}
                        onChange={() => toggleChannel(channel)}
                      />
                      <span>{channel}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button
                type="button"
                className={styles.save}
                onClick={saveCompliance}
                disabled={busy}
              >
                {campaign.complianceReviewedAt
                  ? "Update review record"
                  : "Record compliance review"}
              </button>
            </section>
          )}

          <details className={styles.dangerZone}>
            <summary>
              <AlertTriangle aria-hidden="true" />
              Campaign controls
            </summary>
            <p>Stopping preserves history. Deleting permanently removes it.</p>
            <div>
              {status === "active" && (
                <button type="button" onClick={stop} disabled={busy}>
                  <Square aria-hidden="true" />
                  Stop campaign
                </button>
              )}
              <button
                type="button"
                className={styles.delete}
                onClick={remove}
                disabled={busy}
              >
                <Trash2 aria-hidden="true" />
                Delete campaign
              </button>
            </div>
          </details>
        </div>
      </Dialog>
    </article>
  );
}

function PriceField({
  label,
  currency,
  value,
  onChange,
}: {
  label: string;
  currency: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className={styles.field}>
      {label}
      <span className={styles.moneyField}>
        <small>{currency}</small>
        <input
          type="number"
          min={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </span>
    </label>
  );
}
