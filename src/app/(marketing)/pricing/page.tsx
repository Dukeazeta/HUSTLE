import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import site from "@/components/marketing/site.module.css";
import styles from "../pages.module.css";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "HUSTLE is free during the beta. Planned plans are priced by lead credits: Starter at $19 a month and Pro at $49 a month.",
};

type Plan = {
  name: string;
  amount: string;
  qualifier: string;
  audience: string;
  checks: string[];
  live: boolean;
};

const plans: Plan[] = [
  {
    name: "Beta",
    amount: "$0",
    qualifier: "Free while we build",
    audience: "Everything, with daily limits.",
    checks: ["5 city searches a day", "40 website audits a day", "Every feature included"],
    live: true,
  },
  {
    name: "Trial",
    amount: "$0",
    qualifier: "14 days",
    audience: "Try it on a real city.",
    checks: ["25 lead credits", "Every feature included", "Then choose a plan or stop"],
    live: false,
  },
  {
    name: "Starter",
    amount: "$19",
    qualifier: "per month",
    audience: "A few pitches a week.",
    checks: ["150 lead credits a month", "Every feature included", "Monthly billing"],
    live: false,
  },
  {
    name: "Pro",
    amount: "$49",
    qualifier: "per month",
    audience: "Prospecting every day.",
    checks: ["400 lead credits a month", "Every feature included", "Monthly billing"],
    live: false,
  },
];

const groups: { title: string; rows: [string, ...(string | boolean)[]][] }[] = [
  {
    title: "Usage",
    rows: [
      ["Price", "$0", "$0 for 14 days", "$19 a month", "$49 a month"],
      ["Lead credits", "Daily limits", "25", "150 a month", "400 a month"],
    ],
  },
  {
    title: "Finding leads",
    rows: [
      ["City searches with spending caps", true, true, true, true],
      ["Website audit with evidence and a score", true, true, true, true],
      ["Official website and profile suggestions", true, true, true, true],
    ],
  },
  {
    title: "Pitching and closing",
    rows: [
      ["Short, Warm and Specific drafts", true, true, true, true],
      ["Email, WhatsApp, Instagram and LinkedIn", true, true, true, true],
      ["Follow-up reminders", true, true, true, true],
      ["Proposal, preview, payment and handover", true, true, true, true],
    ],
  },
  {
    title: "Safety",
    rows: [
      ["Private workspace", true, true, true, true],
      ["Shared opt-out protection", true, true, true, true],
    ],
  },
];

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: "What is a lead credit?",
    a: "One credit is used when HUSTLE audits a lead, since that's where most of the work happens. Searching and drafting don't use credits, but searches keep their own daily cap.",
  },
  {
    q: "What are the beta limits?",
    a: "Each workspace can run 5 city searches and 40 website audits a day, with separate daily limits on drafting and web lookups. Limits reset at midnight UTC.",
  },
  {
    q: "When do paid plans start, and will these prices change?",
    a: "Paid plans aren't live yet. The prices on this page are what we plan to launch with, and they may change before then. Nobody is charged during the beta.",
  },
  {
    q: "Does HUSTLE send messages for me?",
    a: "No. HUSTLE drafts the message and opens the right app. You send it from your own email or account, and you can edit every word first.",
  },
  {
    q: "Where does the lead data come from?",
    a: "Business listings come from Google Places. Facts about the website come from the business's own site. Web search can suggest an official website or profile, and those wait for you to confirm them.",
  },
  {
    q: "Who writes the drafts?",
    a: "HUSTLE's AI writes three drafts from the audit findings. You choose one, edit it and decide whether to send it.",
  },
  {
    q: "Which countries does it work in?",
    a: (
      <>
        Any city in the world. In most markets you record a short compliance check before
        drafting, and you&apos;re responsible for following outreach rules where you and
        the business are. See the <Link href="/terms">terms</Link>.
      </>
    ),
  },
];

export default function Pricing() {
  return (
    <>
      <section className={site.band}>
        <div className={site.rail}>
          <div className={styles.centerOpening}>
            <h1 className={site.specialist}>Free while we build it.</h1>
            <p>
              Everything is free during the beta. Paid plans come at launch.
            </p>
          </div>
          <div className={styles.plans}>
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`${styles.plan} ${plan.live ? styles.recommended : ""}`}
              >
                <div className={styles.planTop}>
                  <h2 className={styles.planName}>{plan.name}</h2>
                  {plan.live ? (
                    <span className={styles.tag}>Available now</span>
                  ) : (
                    <span className={styles.tagMuted}>Planned</span>
                  )}
                </div>
                <p className={styles.amount}>{plan.amount}</p>
                <p className={styles.qualifier}>{plan.qualifier}</p>
                <p className={styles.audience}>{plan.audience}</p>
                <ul className={styles.checks}>
                  {plan.checks.map((check) => (
                    <li key={check}>
                      <Check aria-hidden="true" />
                      {check}
                    </li>
                  ))}
                </ul>
                {plan.live ? (
                  <Link href="/login" className={`${site.primary} ${styles.planAction}`}>
                    Start for free
                  </Link>
                ) : (
                  <span
                    className={`${site.secondary} ${styles.planAction}`}
                    aria-disabled="true"
                  >
                    Available at launch
                  </span>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={site.band} aria-labelledby="compare-title">
        <div className={`${site.rail} ${site.ruleTop}`}>
          <div className={styles.compare}>
            <h2 id="compare-title" className={styles.compareTitle}>
              Compare plans. <span>Same features, different credits.</span>
            </h2>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className={styles.srOnly}>Feature</span>
                    </th>
                    {plans.map((plan) => (
                      <th
                        key={plan.name}
                        scope="col"
                        className={plan.live ? styles.shade : undefined}
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                {groups.map((group) => (
                  <tbody key={group.title}>
                    <tr className={styles.group}>
                      <th colSpan={5} scope="colgroup">
                        {group.title}
                      </th>
                    </tr>
                    {group.rows.map(([label, ...values]) => (
                      <tr key={label}>
                        <th scope="row">{label}</th>
                        {values.map((value, index) => (
                          <td key={index} className={index === 0 ? styles.shade : undefined}>
                            {value === true ? (
                              <Check className={styles.yes} aria-label="Included" />
                            ) : value === false ? (
                              <Minus className={styles.yes} aria-label="Not included" />
                            ) : (
                              value
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          </div>

          <div id="faq" className={styles.faq}>
            <h2>Questions</h2>
            {faqs.map((faq) => (
              <details key={faq.q} className={styles.faqRow}>
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
