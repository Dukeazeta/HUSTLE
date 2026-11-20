import type { ReactNode } from "react";
import Link from "next/link";
import {
  FolderOpen,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  TimerReset,
  X,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/auth";
import { Mark } from "@/components/marketing/wordmark";
import { isDemoMode } from "@/lib/demo";
import styles from "./app-shell.module.css";

export type AppRoute = "command" | "campaigns" | "leads" | "followups";

type NavigationItem = {
  id: AppRoute;
  href: string;
  label: string;
  icon: LucideIcon;
};

const navigation: NavigationItem[] = [
  { id: "command", href: "/dashboard", label: "Command centre", icon: LayoutDashboard },
  { id: "campaigns", href: "/campaigns", label: "Campaigns", icon: FolderOpen },
  { id: "leads", href: "/leads", label: "Leads", icon: ListChecks },
  { id: "followups", href: "/follow-ups", label: "Follow-ups", icon: TimerReset },
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
      <aside className={styles.sidebar}>
        <Brand />
        <nav className={styles.navigation} aria-label="Primary navigation">
          {navigation.map((item) => (
            <NavigationLink key={item.id} item={item} active={active === item.id} />
          ))}
        </nav>
        <div className={styles.sidebarFoot}>
          <AccountAction />
        </div>
      </aside>

      <header className={styles.topBar}>
        <Brand />
        <details className={styles.mobileMenu}>
          <summary className={styles.menuButton} aria-label="Toggle navigation">
            <Menu className={styles.openIcon} aria-hidden="true" />
            <X className={styles.closeIcon} aria-hidden="true" />
          </summary>
          <nav className={styles.mobileSheet} aria-label="Mobile navigation">
            {navigation.map((item) => (
              <NavigationLink key={item.id} item={item} active={active === item.id} />
            ))}
            <div className={styles.mobileFoot}>
              <AccountAction />
            </div>
          </nav>
        </details>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}

function AccountAction() {
  if (isDemoMode()) return <span className={styles.demoLabel}>Demo workspace</span>;
  return (
    <form action={logout}>
      <button type="submit" className={styles.logoutButton}>
        <LogOut aria-hidden="true" />
        Log out
      </button>
    </form>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className={styles.brand} aria-label="HUSTLE home">
      <Mark />
      HUSTLE
    </Link>
  );
}

function NavigationLink({ item, active }: { item: NavigationItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`${styles.navigationLink} ${active ? styles.active : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <Icon aria-hidden="true" />
      {item.label}
    </Link>
  );
}
