import site from "./site.module.css";
import styles from "@/app/(marketing)/pages.module.css";

/** Shared reading layout for the beta legal summaries. */
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section className={site.band}>
      <div className={site.rail}>
        <header className={styles.legalHead}>
          <h1 className={site.specialist}>{title}</h1>
          <p>{intro}</p>
        </header>
        <div className={styles.legalBody}>
          <aside className={styles.notice}>
            <strong>Beta summary</strong>
            This is a plain-language summary of how HUSTLE works during the beta. It is not
            the final policy. The full version will be published before public launch.
          </aside>
          <div className={styles.prose}>{children}</div>
        </div>
      </div>
    </section>
  );
}
