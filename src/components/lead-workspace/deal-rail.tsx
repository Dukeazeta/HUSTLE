import { ArrowUpRight, Check, ShieldX } from "lucide-react";
import { countryName } from "@/lib/markets";
import type { Activity, Lead } from "./types";

export function DealRail({
  lead,
  activities,
  currency,
  estimatedValue,
  onOptOut,
}: {
  lead: Lead;
  activities: Activity[];
  currency: string;
  estimatedValue: number;
  onOptOut: () => void;
}) {
  return (
    <aside className="deal-rail">
      <section>
        <div className="rail-heading">
          <h3>Activity</h3>
          <span>Latest</span>
        </div>
        <div className="activity-line">
          {activities.length ? (
            activities.slice(0, 5).map((item) => (
              <article key={item.id}>
                <span>
                  <Check />
                </span>
                <div>
                  <b>{item.type.replaceAll("_", " ")}</b>
                  <p>{item.detail}</p>
                  <small>{new Date(item.createdAt).toLocaleString()}</small>
                </div>
              </article>
            ))
          ) : (
            <div className="rail-empty">No activity recorded yet.</div>
          )}
        </div>
      </section>
      <section>
        <div className="rail-heading">
          <h3>Deal summary</h3>
        </div>
        <dl>
          <div>
            <dt>Business</dt>
            <dd>{lead.name}</dd>
          </div>
          <div>
            <dt>Market</dt>
            <dd>
              {lead.city}, {countryName(lead.country)}
            </dd>
          </div>
          <div>
            <dt>Opportunity score</dt>
            <dd>{lead.score}/100</dd>
          </div>
          <div>
            <dt>Estimated value</dt>
            <dd>
              {currency} {Number(estimatedValue).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt>Stage</dt>
            <dd>{lead.stage.replaceAll("_", " ")}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>
              <a href={lead.sourceUrl} target="_blank" rel="noreferrer">
                Public listing <ArrowUpRight />
              </a>
            </dd>
          </div>
        </dl>
        <button className="danger-link" onClick={onOptOut}>
          <ShieldX />
          Permanently opt out
        </button>
      </section>
    </aside>
  );
}
