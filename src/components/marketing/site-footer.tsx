import Link from "next/link";
import { Wordmark } from "./wordmark";
import styles from "./site.module.css";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/pricing#faq", label: "FAQ" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/login", label: "Start for free" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerRail}>
        <div className={styles.footerGrid}>
          <div>
            <Wordmark />
            <p className={styles.footerNote}>
              Find local businesses that need a better website, prove it, and pitch
              them yourself.
            </p>
          </div>
          <div className={styles.footerColumns}>
            {columns.map((column) => (
              <div key={column.title}>
                <h2>{column.title}</h2>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className={styles.footerLink}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} HUSTLE</span>
          <span>Free during beta</span>
        </div>
      </div>
    </footer>
  );
}

/** Shared dark conversion band that sits directly above the footer. */
export function ClosingBand({ title }: { title: string }) {
  return (
    <section className={styles.closing} aria-label="Get started">
      <div className={styles.closingRail}>
        <h2>{title}</h2>
        <div className={styles.actions}>
          <Link href="/how-it-works" className={`${styles.secondary} ${styles.onDark}`}>
            See how it works
          </Link>
          <Link href="/login" className={`${styles.primary} ${styles.onDark}`}>
            Start for free
          </Link>
        </div>
      </div>
    </section>
  );
}
