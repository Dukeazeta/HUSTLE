"use client";

import { useEffect, useState, type ReactNode } from "react";
import styles from "./guided-chapter.module.css";

export type GuidedItem = {
  id: string;
  label: string;
  claim: string;
  detail: string;
  stage: ReactNode;
  notes?: { title: string; body: string }[];
};

/** Sticky quarter-width rail beside the product stages; the rail tracks the visible stage. */
export function GuidedChapter({ items }: { items: GuidedItem[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    for (const item of items) {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <div className={styles.chapter}>
      <nav className={styles.rail} aria-label="Workflow steps">
        <ol>
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={styles.railLink}
                aria-current={active === item.id ? "step" : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className={styles.stages}>
        {items.map((item) => (
          <article key={item.id} id={item.id} className={styles.benefit}>
            <h3 className={styles.lead}>
              {item.claim} <span>{item.detail}</span>
            </h3>
            <div className={styles.stage}>{item.stage}</div>
            {item.notes ? (
              <div className={styles.notes}>
                {item.notes.map((note) => (
                  <div key={note.title}>
                    <strong>{note.title}</strong>
                    <p>{note.body}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
