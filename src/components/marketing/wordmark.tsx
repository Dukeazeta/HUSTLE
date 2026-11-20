import Link from "next/link";
import styles from "./site.module.css";

/** HUSTLE mark: a charcoal tile with an H whose crossbar is the signal blue. */
export function Mark() {
  return (
    <svg viewBox="0 0 22 22" aria-hidden="true">
      <rect width="22" height="22" rx="6" fill="#1f2125" />
      <path d="M7 6v10M15 6v10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M7.5 11h7" stroke="#6f95ff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className={styles.wordmark} aria-label="HUSTLE home">
      <Mark />
      HUSTLE
    </Link>
  );
}
