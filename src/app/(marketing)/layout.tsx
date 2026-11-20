import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";
import { SmoothScroll } from "@/components/marketing/smooth-scroll";
import styles from "@/components/marketing/site.module.css";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.site}>
      <a href="#content" className={styles.skip}>
        Skip to content
      </a>
      <SiteNav />
      <main id="content" className={styles.main}>
        {children}
      </main>
      <SiteFooter />
      <SmoothScroll />
    </div>
  );
}
