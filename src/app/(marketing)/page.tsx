import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  EmailIcon,
  InstagramIcon,
  LinkedInIcon,
  WhatsAppIcon,
} from "@/components/marketing/channel-icons";
import { Funnel, Horizon, ScaleCurve } from "@/components/marketing/graphics";
import { GuidedChapter, type GuidedItem } from "@/components/marketing/guided-chapter";
import { ProductStage } from "@/components/marketing/product-stage";
import { ClosingBand } from "@/components/marketing/site-footer";
import {
  AuditPanel,
  ClosePanel,
  PitchPanel,
  SearchPanel,
} from "@/components/marketing/stage-panels";
import site from "@/components/marketing/site.module.css";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: { absolute: "HUSTLE: find, prove and pitch your next website client" },
  description:
    "HUSTLE finds local businesses with weak websites, audits them, and drafts a pitch from what it found. You approve every word and send it yourself.",
};

const sources: { role: string; name: string; icon?: React.ReactNode }[] = [
  { role: "Finds businesses with", name: "Google Places" },
  { role: "Checks facts on", name: "Their own website" },
  { role: "Finds official links with", name: "Brave Search" },
  { role: "Drafts with", name: "AI" },
  { role: "Send by", name: "Email", icon: <EmailIcon /> },
  { role: "Send by", name: "WhatsApp", icon: <WhatsAppIcon /> },
  { role: "Send by", name: "Instagram", icon: <InstagramIcon /> },
  { role: "Send by", name: "LinkedIn", icon: <LinkedInIcon /> },
];

const guided: GuidedItem[] = [
  {
    id: "search",
    label: "Search a city",
    claim: "Search any city.",
    detail:
      "Pick a place and a kind of business. Every search has a spending cap.",
    stage: <SearchPanel />,
  },
  {
    id: "audit",
    label: "Audit the website",
    claim: "Audit every website.",
    detail:
      "Each finding keeps its evidence, and every lead gets a score out of 100.",
    stage: <AuditPanel />,
    notes: [
      {
        title: "Evidence, not opinions",
        body: "Each finding records what was measured.",
      },
      {
        title: "Best leads first",
        body: "Scores weigh website need and how easy the owner is to reach.",
      },
    ],
  },
  {
    id: "pitch",
    label: "Draft the pitch",
    claim: "Draft from the findings.",
    detail:
      "Three versions that quote what the audit found. Pick one, edit, send.",
    stage: <PitchPanel />,
  },
  {
    id: "close",
    label: "Follow up and close",
    claim: "Follow up once, then close.",
    detail:
      "One reminder after five business days. Proposal to payment on the same lead.",
    stage: <ClosePanel />,
    notes: [
      {
        title: "One reminder, never a sequence",
        body: "You decide whether to send it.",
      },
      {
        title: "Handover after payment",
        body: "Handover unlocks once you record payment.",
      },
    ],
  },
];

const assurances = [
  {
    title: "You press send",
    body: "No auto-send, no sequences, no bulk blasts.",
  },
  {
    title: "Opt-outs are shared",
    body: "Say no once and nobody on HUSTLE can pitch you again.",
  },
  {
    title: "Rules before drafts",
    body: "Most markets need a quick compliance check before drafting.",
  },
  {
    title: "Private by default",
    body: "Your leads and pitches are visible only to you.",
  },
];

const stats = [
  { value: "12", label: "findings an audit can flag" },
  { value: "3", label: "drafts per lead" },
  { value: "4", label: "channels to send from" },
  { value: "5", label: "business days to a reminder" },
];

const updates = [
  {
    date: "Nov 20, 2026",
    title: "A private workspace for every account",
    body: "Your campaigns and leads are yours alone.",
  },
  {
    date: "Nov 20, 2026",
    title: "A newer AI model for drafts",
    body: "Drafts and summaries moved to a newer model.",
  },
  {
    date: "Nov 20, 2026",
    title: "Safer website audits",
    body: "Audits only reach public addresses.",
  },
  {
    date: "Jul 14, 2026",
    title: "Official links and social profiles",
    body: "Suggested links wait for your confirmation.",
  },
];

export default function Home() {
  return (
    <>
      <section className={`${site.band} ${styles.heroBand}`}>
        <div className={`${site.rail} ${styles.hero}`}>
          <div className={styles.heroCopy}>
            <Link href="#updates" className={styles.news}>
              New: private workspaces
              <ArrowRight aria-hidden="true" />
            </Link>
            <h1 className={site.display}>Find clients. Prove the problem. Pitch it.</h1>
            <p className={`${site.support} ${styles.heroSupport}`}>
              Find local businesses with weak websites, prove it with an audit, and send the
              pitch yourself.
            </p>
            <div className={`${site.actions} ${styles.heroActions}`}>
              <Link href="/how-it-works" className={site.secondary}>
                See how it works
              </Link>
              <Link href="/login" className={site.primary}>
                Start for free
              </Link>
            </div>
          </div>
          <div className={styles.stageWrap}>
            <div className={styles.atmosphere} aria-hidden="true" />
            <ProductStage />
          </div>
        </div>
      </section>

      <section className={site.band} aria-label="Data sources and channels">
        <div className={`${site.rail} ${styles.matrix}`}>
          {sources.map((source) => (
            <div key={`${source.role}-${source.name}`} className={styles.matrixCell}>
              <span>{source.role}</span>
              <strong>
                {source.icon ? <span className={styles.appIcon}>{source.icon}</span> : null}
                {source.name}
              </strong>
            </div>
          ))}
        </div>
      </section>

      <section className={site.band} aria-labelledby="workflow-title">
        <div className={site.rail}>
          <div className={`${site.inset} ${styles.chapterIntro}`}>
            <h2 id="workflow-title" className={site.pair}>
              Every lead arrives with its evidence.{" "}
              <span>Your first message already knows what&apos;s wrong.</span>
            </h2>
          </div>
          <GuidedChapter items={guided} />
        </div>
      </section>

      <section className={styles.theater} aria-labelledby="theater-title">
        <div className={styles.theaterRail}>
          <h2 id="theater-title" className={styles.monument}>
            Nothing sends itself.
          </h2>
          <Horizon />
          <div className={styles.assurances}>
            {assurances.map((item) => (
              <div key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
          <div className={styles.split}>
            <div className={styles.splitText}>
              <h3 className={site.pair}>
                Built on public evidence.{" "}
                <span>Google listings, the business&apos;s own site, and links you confirm.</span>
              </h3>
              <Link href="/how-it-works" className={`${site.secondary} ${site.onDark}`}>
                Where the data comes from <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.splitArt}>
              <Funnel />
            </div>
          </div>
        </div>
      </section>

      <section className={site.band} aria-label="The idea behind HUSTLE">
        <div className={`${site.rail} ${styles.proof}`}>
          <blockquote>
            A good pitch tells an owner something true they hadn&apos;t noticed.
          </blockquote>
          <p>The idea HUSTLE is built on</p>
        </div>
      </section>

      <section className={site.band} aria-labelledby="scale-title">
        <div className={`${site.rail} ${site.ruleTop} ${styles.scale}`}>
          <ScaleCurve />
          <div className={`${site.inset} ${styles.scaleText}`}>
            <h2 id="scale-title" className={site.pair}>
              Specific by default.{" "}
              <span>How every lead is handled.</span>
            </h2>
            <dl className={styles.stats}>
              {stats.map((stat) => (
                <div key={stat.label} className={styles.stat}>
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section id="updates" className={site.band} aria-labelledby="updates-title">
        <div className={`${site.rail} ${site.ruleTop}`}>
          <div className={`${site.inset} ${styles.chapterIntro}`}>
            <h2 id="updates-title" className={site.pair}>
              Recent changes. <span>What shipped, and when.</span>
            </h2>
          </div>
          <div className={styles.updates}>
            {updates.map((update) => (
              <article key={update.title} className={styles.update}>
                <time>{update.date}</time>
                <h3>{update.title}</h3>
                <p>{update.body}</p>
                <span className={styles.updateLine} aria-hidden="true" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <ClosingBand title="Your next client is one search away." />
    </>
  );
}
