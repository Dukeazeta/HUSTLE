import type { Metadata } from "next";
import Link from "next/link";
import { ClosingBand } from "@/components/marketing/site-footer";
import { SearchPanel } from "@/components/marketing/stage-panels";
import site from "@/components/marketing/site.module.css";
import styles from "../pages.module.css";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Search a city, audit every website, draft a pitch from the evidence, follow up once, and track the project through to payment.",
};

const flow = [
  ["Search a city", "Google Places"],
  ["Import the listings", "Up to your cap"],
  ["Audit each website", "12 possible findings"],
  ["Score the lead", "Out of 100"],
  ["Draft three pitches", "From the findings"],
  ["You approve and send", "Your own account"],
  ["One reminder", "5 business days"],
  ["Proposal to payment", "Same lead"],
];

const checks: { severity: "High" | "Medium" | "Low"; title: string; body: string }[] = [
  {
    severity: "High",
    title: "No business website",
    body: "The easiest pitch to make.",
  },
  {
    severity: "High",
    title: "Website is not secure",
    body: "Browsers warn visitors away.",
  },
  {
    severity: "High",
    title: "Website is unreachable or erroring",
    body: "The site doesn't load.",
  },
  {
    severity: "High",
    title: "Mobile viewport is missing",
    body: "It breaks on phones.",
  },
  {
    severity: "High",
    title: "No clear conversion action",
    body: "No way to book, call or ask for a quote.",
  },
  {
    severity: "Medium",
    title: "Slow initial response",
    body: "Visitors wait before anything loads.",
  },
  {
    severity: "Medium",
    title: "Heavy page",
    body: "Slow on mobile data.",
  },
  {
    severity: "Medium",
    title: "Weak title or hidden contact details",
    body: "Hard to find, harder to contact.",
  },
  {
    severity: "Low",
    title: "No meta description",
    body: "Google writes the summary for them.",
  },
];

const controls = [
  {
    title: "No auto-send",
    body: "Messages leave from your account.",
  },
  {
    title: "Search results wait",
    body: "Found links need your OK.",
  },
  {
    title: "Opt-outs are shared",
    body: "One no blocks everyone.",
  },
  {
    title: "Compliance first",
    body: "A quick check before drafting.",
  },
  {
    title: "Private workspace",
    body: "Only you see your leads.",
  },
];

const assurances = [
  {
    title: "Spending stays capped.",
    body: "Per-search caps and daily limits.",
  },
  {
    title: "Audits stay public.",
    body: "Only public addresses, read up to a fixed size.",
  },
  {
    title: "Evidence stays attached.",
    body: "Check every finding before you pitch.",
  },
];

export default function HowItWorks() {
  return (
    <>
      <section className={site.band}>
        <div className={`${site.rail} ${styles.featureOpening}`}>
          <div className={styles.featureCopy}>
            <h1 className={site.specialist}>From a city name to a paid project.</h1>
            <p>
              HUSTLE does the research. You keep the conversation.
            </p>
            <div className={`${site.actions} ${styles.actionsGap}`}>
              <Link href="/pricing" className={site.secondary}>
                See pricing
              </Link>
              <Link href="/login" className={site.primary}>
                Start for free
              </Link>
            </div>
          </div>
          <ol className={styles.flow} aria-label="The HUSTLE workflow">
            {flow.map(([step, note]) => (
              <li key={step} className={step.startsWith("You") ? styles.you : undefined}>
                {step}
                <small>{note}</small>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={site.band} aria-labelledby="checks-title">
        <div className={site.rail}>
          <div className={`${styles.controlIntro} ${site.ruleTop}`}>
            <h2 id="checks-title" className={site.pair}>
              What every audit looks for.{" "}
              <span>
                Twelve findings, each with its evidence.
              </span>
            </h2>
          </div>
          <div className={styles.cells}>
            {checks.map((check) => (
              <div key={check.title} className={styles.cell}>
                <span
                  className={
                    check.severity === "High"
                      ? styles.sevHigh
                      : check.severity === "Medium"
                        ? styles.sevMedium
                        : styles.sevLow
                  }
                >
                  {check.severity}
                </span>
                <h3>{check.title}</h3>
                <p>{check.body}</p>
              </div>
            ))}
          </div>
          <div className={styles.serifPause}>
            <p>Specific beats clever.</p>
          </div>
        </div>
      </section>

      <section className={site.band} aria-labelledby="start-title">
        <div className={`${site.rail} ${styles.adoption}`}>
          <div className={styles.adoptionText}>
            <h2 id="start-title" className={site.pair}>
              Running in minutes. <span>Just a Google account.</span>
            </h2>
            <ol className={styles.steps}>
              <li>
                <div>
                  <strong>Sign in with Google</strong>
                  <span>Your workspace is ready instantly.</span>
                </div>
              </li>
              <li>
                <div>
                  <strong>Create a campaign</strong>
                  <span>A city and a kind of business.</span>
                </div>
              </li>
              <li>
                <div>
                  <strong>Search and audit</strong>
                  <span>Audit the listings worth a look.</span>
                </div>
              </li>
              <li>
                <div>
                  <strong>Pitch your best lead</strong>
                  <span>Pick a draft and send it yourself.</span>
                </div>
              </li>
            </ol>
          </div>
          <div className={styles.adoptionStage}>
            <SearchPanel />
          </div>
        </div>
      </section>

      <section className={styles.darkChapter} aria-labelledby="control-title">
        <div className={styles.darkRail}>
          <h2 id="control-title" className={styles.darkMonument}>
            You press send.
          </h2>
          <div className={styles.darkCells}>
            {controls.map((control) => (
              <div key={control.title}>
                <h3>{control.title}</h3>
                <p>{control.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={site.band} aria-labelledby="trust-title">
        <div className={site.rail}>
          <div className={styles.controlIntro}>
            <h2 id="trust-title" className={site.pair}>
              Careful by design. <span>With your budget and their websites.</span>
            </h2>
          </div>
          <div className={styles.cells}>
            {assurances.map((item) => (
              <div key={item.title} className={styles.cell}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ClosingBand title="Try it on your own city." />
    </>
  );
}
