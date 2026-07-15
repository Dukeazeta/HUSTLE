"use client";

import { useCallback, useState } from "react";
import { Plus, Search } from "lucide-react";
import { MARKETS } from "@/lib/markets";
import { Combobox } from "@/components/ui/combobox";
import { Dialog } from "@/components/ui/dialog";
import styles from "./campaign-creator.module.css";

const formId = "create-campaign-form";

const marketOptions = MARKETS.map((market) => ({
  value: market.code,
  label: `${market.name} (${market.code})`,
  keywords: market.name,
}));

export function CampaignCreator({ configured }: { configured: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [country, setCountry] = useState("NG");

  const close = useCallback(() => setOpen(false), []);

  function openCreator() {
    setMessage("");
    setOpen(true);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!country) {
      setMessage("Choose a country from the results.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          country,
          city: form.get("city"),
          category: form.get("category"),
          resultLimit: Number(form.get("resultLimit")),
          budgetMinor: Number(form.get("budgetMinor")),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Could not create the campaign.");
        return;
      }

      location.reload();
    } catch {
      setMessage("Could not create the campaign. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className={styles.trigger}
        onClick={openCreator}
        disabled={!configured}
        title={!configured ? "Connect the database to create campaigns" : undefined}
      >
        <Plus aria-hidden="true" />
        New campaign
      </button>

      <Dialog
        open={open}
        onClose={close}
        eyebrow="New search"
        title="Create a campaign"
        description="Choose one market and business category to begin finding leads."
        footer={
          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={close}>
              Cancel
            </button>
            <button
              type="submit"
              form={formId}
              className={styles.submit}
              disabled={busy}
            >
              <Search aria-hidden="true" />
              {busy ? "Creating campaign…" : "Create campaign"}
            </button>
          </div>
        }
      >
        <form id={formId} className={styles.form} onSubmit={submit}>
          <div className={styles.sectionHeading}>
            <span>1</span>
            <div>
              <h3>Search area</h3>
              <p>Keep each campaign focused so its results stay useful.</p>
            </div>
          </div>

          <div className={styles.grid}>
            <label className={styles.wide}>
              Campaign name
              <input
                name="name"
                placeholder="Lagos restaurant search"
                required
                minLength={3}
                data-autofocus
              />
            </label>
            <Combobox
              label="Country or territory"
              value={country}
              options={marketOptions}
              onChange={setCountry}
              placeholder="Search worldwide"
              required
            />
            <label>
              City
              <input name="city" placeholder="Lagos" required />
            </label>
            <label className={styles.wide}>
              Business category
              <select name="category" defaultValue="restaurant">
                <option value="restaurant">Restaurants</option>
                <option value="hotel">Hotels</option>
                <option value="salon">Salons</option>
                <option value="spa">Spas</option>
                <option value="caterer">Caterers</option>
                <option value="event_venue">Event venues</option>
                <option value="beauty">Beauty businesses</option>
              </select>
            </label>
          </div>

          <details className={styles.advanced}>
            <summary>Search limits</summary>
            <p>These defaults work for most campaigns.</p>
            <div className={styles.grid}>
              <label>
                Result limit
                <input
                  name="resultLimit"
                  type="number"
                  defaultValue={20}
                  min={1}
                  max={60}
                />
              </label>
              <label>
                Provider budget
                <input
                  name="budgetMinor"
                  type="number"
                  defaultValue={2000}
                  min={0}
                />
              </label>
            </div>
          </details>

          {message && (
            <p className={styles.error} role="alert">
              {message}
            </p>
          )}
        </form>
      </Dialog>
    </>
  );
}
