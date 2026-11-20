import type { ReactNode } from "react";
import styles from "./system-state.module.css";

export function SystemState({
  icon,
  title,
  body,
  actions,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  actions?: ReactNode;
}) {
  return (
    <main className={styles.page}>
      <section className={styles.state}>
        <span className={styles.icon}>{icon}</span>
        <h1>{title}</h1>
        <p>{body}</p>
        {actions && <div className={styles.actions}>{actions}</div>}
      </section>
    </main>
  );
}
