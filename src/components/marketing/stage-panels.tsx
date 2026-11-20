import { Check, Copy, Lock, Mail, MessageCircle, Search } from "lucide-react";
import styles from "./stage-panels.module.css";

/* White task panels staged on pale gray. All data is sample data. */

export function SearchPanel() {
  return (
    <div className={styles.scene} aria-hidden="true">
      <div className={styles.panel}>
        <div className={styles.panelTitle}>New campaign</div>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span>City</span>
            <b>Accra, Ghana</b>
          </label>
          <label className={styles.field}>
            <span>Business type</span>
            <b>Hair salons and spas</b>
          </label>
          <label className={styles.field}>
            <span>Results per search</span>
            <b>20</b>
          </label>
          <label className={styles.field}>
            <span>Budget cap</span>
            <b>$2.00</b>
          </label>
        </div>
        <div className={styles.panelFoot}>
          <span className={styles.btnPrimary}>
            <Search /> Search
          </span>
        </div>
      </div>
      <div className={`${styles.float} ${styles.floatRight}`}>
        <strong>20 businesses found</strong>
        <span>17 new · 3 already saved, updated in place</span>
      </div>
    </div>
  );
}

export function AuditPanel() {
  const findings = [
    ["High", "Website is not secure", "The listed URL uses http:"],
    ["High", "Mobile viewport is missing", "No viewport meta tag was detected."],
    ["High", "No clear conversion action", "No booking, contact, call or quote action."],
    ["Medium", "Slow initial response", "The server took 3,840 ms to respond."],
  ];
  return (
    <div className={styles.scene} aria-hidden="true">
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <div className={styles.panelTitle}>Marigold Salon</div>
            <span className={styles.meta}>marigoldsalon.example · Osu, Accra</span>
          </div>
          <span className={styles.score}>
            78<small>/100</small>
          </span>
        </div>
        <ul className={styles.findings}>
          {findings.map(([severity, title, evidence]) => (
            <li key={title}>
              <span className={severity === "High" ? styles.sevHigh : styles.sevMedium}>
                {severity}
              </span>
              <div>
                <b>{title}</b>
                <small>{evidence}</small>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className={`${styles.float} ${styles.floatLeft}`}>
        <strong>Contacts found on the site</strong>
        <span>
          <Mail /> hello@marigoldsalon.example
        </span>
        <span>
          <MessageCircle /> WhatsApp link
        </span>
      </div>
    </div>
  );
}

export function PitchPanel() {
  return (
    <div className={styles.scene} aria-hidden="true">
      <div className={styles.panel}>
        <div className={styles.tabs}>
          <span>Short</span>
          <span>Warm</span>
          <span className={styles.tabActive}>Specific</span>
        </div>
        <p className={styles.draftText}>
          Hi, I opened Marigold on my phone and <mark>the page doesn&apos;t resize</mark>, so
          the price list runs off the screen. There&apos;s also{" "}
          <mark>no way to book from the site</mark>. Want a quick fix for both?
        </p>
        <div className={styles.panelFoot}>
          <span className={styles.btnSecondary}>
            <Copy /> Copy
          </span>
          <span className={styles.btnPrimary}>
            <MessageCircle /> Open WhatsApp
          </span>
        </div>
      </div>
      <div className={`${styles.float} ${styles.floatRight}`}>
        <strong>
          <Check /> Not on any opt-out list
        </strong>
        <span>Checked against every workspace</span>
      </div>
    </div>
  );
}

export function ClosePanel() {
  const stages = [
    ["Pitch sent", "Nov 13", "done"],
    ["Follow-up reminder", "Nov 20", "done"],
    ["Proposal", "Nov 24", "done"],
    ["Preview approved", "Today", "now"],
    ["Payment", "Next", "next"],
    ["Handover", "After payment", "locked"],
  ];
  return (
    <div className={styles.scene} aria-hidden="true">
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <div className={styles.panelTitle}>Marigold Salon</div>
            <span className={styles.meta}>Booking site · $450</span>
          </div>
        </div>
        <ol className={styles.timeline}>
          {stages.map(([label, when, state]) => (
            <li key={label} data-state={state}>
              <i>{state === "done" ? <Check /> : state === "locked" ? <Lock /> : null}</i>
              <b>{label}</b>
              <small>{when}</small>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
