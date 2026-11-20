import {
  Copy,
  FolderOpen,
  LayoutDashboard,
  ListChecks,
  MessageCircle,
  Search,
  TimerReset,
} from "lucide-react";
import { Mark } from "./wordmark";
import styles from "./product-stage.module.css";

const leads = [
  { name: "Marigold Salon", area: "Osu", site: "Not secure", score: 78, stage: "Qualified" },
  { name: "Copper Kitchen", area: "East Legon", site: "No website", score: 74, stage: "Qualified" },
  { name: "Lumen Spa", area: "Labone", site: "No booking action", score: 66, stage: "Audited" },
  { name: "Harbour View Hotel", area: "Jamestown", site: "Slow response", score: 41, stage: "Audited" },
  { name: "Kente & Co. Catering", area: "Cantonments", site: "Checked", score: 23, stage: "Imported" },
];

/** The opening product scene: one campaign, one audited lead, one draft. Sample data. */
export function ProductStage() {
  return (
    <figure className={styles.frame} aria-label="HUSTLE with sample data: a campaign, an audit and a pitch draft">
      <div className={styles.window} aria-hidden="true">
        <div className={styles.titlebar}>
          <span className={styles.dots}>
            <i />
            <i />
            <i />
          </span>
        </div>
        <div className={styles.app}>
          <aside className={styles.sidebar}>
            <span className={styles.appBrand}>
              <Mark /> HUSTLE
            </span>
            <span className={styles.navRow}>
              <LayoutDashboard /> Command centre
            </span>
            <span className={`${styles.navRow} ${styles.navActive}`}>
              <FolderOpen /> Campaigns
            </span>
            <span className={styles.navRow}>
              <ListChecks /> Leads
            </span>
            <span className={styles.navRow}>
              <TimerReset /> Follow-ups
            </span>
          </aside>
          <div className={styles.main}>
            <div className={styles.mainHead}>
              <div>
                <strong>Hair salons and spas</strong>
                <span>Accra, Ghana · 20 imported</span>
              </div>
              <span className={styles.searchBtn}>
                <Search /> Search again
              </span>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Website</th>
                  <th>Score</th>
                  <th>Stage</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, index) => (
                  <tr key={lead.name} className={index === 0 ? styles.selected : undefined}>
                    <td>
                      {lead.name}
                      <small>{lead.area}</small>
                    </td>
                    <td>{lead.site}</td>
                    <td>
                      <span className={lead.score >= 60 ? styles.scoreHigh : styles.score}>
                        {lead.score}
                      </span>
                    </td>
                    <td>{lead.stage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={`${styles.layer} ${styles.audit}`} aria-hidden="true">
        <div className={styles.layerHead}>
          <strong>Marigold Salon</strong>
          <span>Audit</span>
        </div>
        <ul className={styles.findings}>
          <li>
            <i className={styles.high} /> Website is not secure
            <small>The listed URL uses http:</small>
          </li>
          <li>
            <i className={styles.high} /> Mobile viewport is missing
            <small>No viewport meta tag was detected.</small>
          </li>
          <li>
            <i className={styles.high} /> No clear conversion action
            <small>No booking, contact, call or quote action.</small>
          </li>
        </ul>
      </div>

      <div className={`${styles.layer} ${styles.draft}`} aria-hidden="true">
        <div className={styles.layerHead}>
          <strong>Draft · Specific</strong>
          <span>Not sent</span>
        </div>
        <p>
          Hi, I opened Marigold on my phone and the page doesn&apos;t resize, so the price
          list runs off the screen. There&apos;s also no way to book from the site.
        </p>
        <div className={styles.draftActions}>
          <span>
            <Copy /> Copy
          </span>
          <span className={styles.draftPrimary}>
            <MessageCircle /> Open WhatsApp
          </span>
        </div>
      </div>
      <figcaption className={styles.caption}>Sample data</figcaption>
    </figure>
  );
}
