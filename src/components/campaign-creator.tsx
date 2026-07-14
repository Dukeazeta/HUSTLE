"use client";

import { useState } from "react";
import { Plus, Search, X } from "lucide-react";

export function CampaignCreator({ configured }: { configured: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const body = {
      name: form.get("name"),
      country: form.get("country"),
      city: form.get("city"),
      category: form.get("category"),
      resultLimit: Number(form.get("resultLimit")),
      budgetMinor: Number(form.get("budgetMinor")),
    };
    const response = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok)
      return setMessage(data.error ?? "Could not create campaign");
    location.reload();
  }
  if (!open)
    return (
      <button
        className="primary-button"
        onClick={() => setOpen(true)}
        disabled={!configured}
        title={!configured ? "Configure Turso first" : undefined}
      >
        <Plus size={17} /> New campaign
      </button>
    );
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-title">
          <div>
            <span className="eyebrow">New search</span>
            <h2>Create campaign</h2>
          </div>
          <button className="icon-button" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="form-grid">
          <label>
            Campaign name
            <input
              name="name"
              placeholder="Lagos hotel websites"
              required
              minLength={3}
            />
          </label>
          <label>
            Market
            <select name="country">
              <option value="NG">Nigeria</option>
              <option value="UK">United Kingdom</option>
            </select>
          </label>
          <label>
            City
            <input name="city" placeholder="Lagos" required />
          </label>
          <label>
            Category
            <select name="category">
              <option value="restaurant">Restaurants</option>
              <option value="hotel">Hotels</option>
              <option value="salon">Salons</option>
              <option value="spa">Spas</option>
              <option value="caterer">Caterers</option>
              <option value="event_venue">Event venues</option>
              <option value="beauty">Beauty businesses</option>
            </select>
          </label>
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
            Search budget (minor units)
            <input
              name="budgetMinor"
              type="number"
              defaultValue={2000}
              min={0}
            />
          </label>
          {message && <p className="form-error">{message}</p>}
          <button className="primary-button full" disabled={busy}>
            <Search size={17} />
            {busy ? "Creating…" : "Create campaign"}
          </button>
        </form>
      </div>
    </div>
  );
}
