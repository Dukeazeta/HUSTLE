"use client";

import { useCallback, useState } from "react";
import { Plus, Search } from "lucide-react";
import {
  CATEGORY_MAX_LENGTH,
  CATEGORY_SUGGESTIONS,
  categoryLabel,
  normalizeCategory,
} from "@/lib/categories";
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
  const [category, setCategory] = useState("restaurant");
  const selectedSlug = normalizeCategory(category);

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
    if (!normalizeCategory(category)) {
      setMessage(`Enter a business type of 2 to ${CATEGORY_MAX_LENGTH} letters, like "dental clinic".`);
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
          category,
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
        title="Create a campaign"
        description="Pick a city and any kind of business to start finding leads."
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
            <div className={`${styles.wide} ${styles.categoryField}`}>
              <label>
                Business type
                <input
                  name="category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="e.g. dental clinic, gym, law firm"
                  maxLength={CATEGORY_MAX_LENGTH}
                  autoComplete="off"
                  required
                />
              </label>
              <div className={styles.suggestions} role="group" aria-label="Suggested business types">
                {CATEGORY_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className={styles.suggestion}
                    aria-pressed={selectedSlug === suggestion}
                    onClick={() => setCategory(categoryLabel(suggestion))}
                  >
                    {categoryLabel(suggestion)}
                  </button>
                ))}
              </div>
              <p className={styles.fieldHelp}>
                Any kind of business works. HUSTLE searches Google for it in your city.
              </p>
            </div>
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
