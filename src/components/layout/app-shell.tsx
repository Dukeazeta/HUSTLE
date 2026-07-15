import type { ReactNode } from "react";
import Link from "next/link";
import { LogOut, Menu, X } from "lucide-react";
import { signOut } from "@/auth";
import styles from "./app-shell.module.css";

export type AppRoute = "command" | "campaigns" | "leads" | "followups";

type NavigationItem = {
  id: AppRoute;
  href: string;
  label: string;
};

const navigation: NavigationItem[] = [
  { id: "command", href: "/", label: "Command centre" },
  { id: "campaigns", href: "/campaigns", label: "Campaigns" },
  { id: "leads", href: "/leads", label: "Leads" },
  { id: "followups", href: "/follow-ups", label: "Follow-ups" },
];

async function logout() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export function AppShell({
  active,
  children,
}: {
  active: AppRoute;
  children: ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <header className={styles.topNavigation}>
        <div className={styles.navigationCanvas}>
          <Brand />

          <div className={styles.desktopActions}>
            <nav className={styles.desktopNavigation} aria-label="Primary navigation">
              {navigation.map((item) => (
                <NavigationLink
                  key={item.id}
                  item={item}
                  active={active === item.id}
                />
              ))}
            </nav>
            <LogoutButton />
          </div>

          <details className={styles.mobileMenu}>
            <summary className={styles.menuButton} aria-label="Toggle navigation">
              <Menu className={styles.openIcon} aria-hidden="true" />
              <X className={styles.closeIcon} aria-hidden="true" />
            </summary>
            <nav className={styles.mobileSheet} aria-label="Mobile navigation">
              <div className={styles.mobileSheetCanvas}>
                {navigation.map((item) => (
                  <NavigationLink
                    key={item.id}
                    item={item}
                    active={active === item.id}
                  />
                ))}
                <LogoutButton mobile />
                <span className={styles.workspaceLabel}>Private sales workspace</span>
              </div>
            </nav>
          </details>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}

function LogoutButton({ mobile = false }: { mobile?: boolean }) {
  return (
    <form action={logout} className={mobile ? styles.mobileLogout : styles.logoutForm}>
      <button type="submit" className={styles.logoutButton}>
        <LogOut aria-hidden="true" />
        <span>Log out</span>
      </button>
    </form>
  );
}

function Brand() {
  return (
    <Link href="/" className={styles.brand} aria-label="HUSTLE home">
      <span className={styles.brandGlyph} aria-hidden="true">
        H
      </span>
      <span>HUSTLE</span>
    </Link>
  );
}

function NavigationLink({
  item,
  active,
}: {
  item: NavigationItem;
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`${styles.navigationLink} ${active ? styles.active : ""}`}
      aria-current={active ? "page" : undefined}
    >
      {item.label}
    </Link>
  );
}
