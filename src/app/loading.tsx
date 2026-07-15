import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.shell} role="status" aria-live="polite">
      <span className={styles.srOnly}>Loading workspace</span>
      <header className={styles.topbar} aria-hidden="true">
        <span className={styles.brand} />
        <div className={styles.navigation}>
          <span />
          <span />
          <span />
          <span />
        </div>
        <span className={styles.action} />
      </header>
      <main className={styles.main} aria-hidden="true">
        <div className={styles.heading} />
        <div className={styles.subheading} />
        <div className={styles.panel} />
        <div className={styles.row}>
          <div />
          <div />
        </div>
      </main>
    </div>
  );
}
