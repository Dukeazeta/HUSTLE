import type { ReactNode } from "react";
import styles from "./system-state.module.css";

export function SystemState({
  icon,
  eyebrow,
  title,
  body,
  actions,
}: {
  icon: ReactNode;
  eyebrow?: string;
  title: string;
  body: string;
  actions?: ReactNode;
}) {
  return (
    <main className={styles.page}>
      <section className={styles.state}>
        <span className={styles.icon}>{icon}</span>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{body}</p>
        {actions && <div className={styles.actions}>{actions}</div>}
      </section>
    </main>
  );
}
