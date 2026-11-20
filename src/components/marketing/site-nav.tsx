"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { Wordmark } from "./wordmark";
import styles from "./site.module.css";

const links = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteNav() {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);

  // The layout persists across pages, so close the mobile menu after navigating.
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);

  return (
    <>
      <div className={styles.announce}>
        <span>Free during the beta.</span>
        <Link href="/pricing">
          See pricing <ArrowRight aria-hidden="true" />
        </Link>
      </div>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <Wordmark />
          <nav aria-label="Main">
            <ul className={styles.navList}>
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={styles.navItem}
                    aria-current={pathname === link.href ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className={styles.headerActions}>
            <Link href="/login" className={`${styles.secondary} ${styles.hideSmall}`}>
              Sign in
            </Link>
            <Link href="/login" className={styles.primary}>
              Start for free
            </Link>
            <details ref={menu} className={styles.mobileMenu}>
              <summary className={styles.menuButton} aria-label="Menu">
                <Menu className={styles.openIcon} aria-hidden="true" />
                <X className={styles.closeIcon} aria-hidden="true" />
              </summary>
              <nav className={styles.mobileSheet} aria-label="Mobile">
                <Link href="/" className={styles.navItem}>
                  Home
                </Link>
                {links.map((link) => (
                  <Link key={link.href} href={link.href} className={styles.navItem}>
                    {link.label}
                  </Link>
                ))}
                <div className={styles.actions}>
                  <Link href="/login" className={styles.secondary}>
                    Sign in
                  </Link>
                  <Link href="/login" className={styles.primary}>
                    Start for free
                  </Link>
                </div>
              </nav>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
