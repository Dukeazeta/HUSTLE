"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * Slow, eased page scrolling for the marketing site (same feel as ochaprime:
 * lerp 0.11). Skipped entirely when the visitor prefers reduced motion.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const lenis = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    lenis.current = new Lenis({
      autoRaf: true,
      lerp: 0.11,
      // In-page links (#faq, the workflow rail) glide too, clearing the sticky header.
      anchors: { offset: -88 },
    });
    return () => {
      lenis.current?.destroy();
      lenis.current = null;
    };
  }, []);

  useEffect(() => {
    if (!window.location.hash) lenis.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
