let warnedAboutProduction = false;

/**
 * Demo mode serves read-only sample data without signing in. It is ignored on
 * Vercel production so a stray DEMO_MODE=true can never open the real app.
 */
export function isDemoMode() {
  if (process.env.DEMO_MODE !== "true") return false;
  if (process.env.VERCEL_ENV === "production") {
    if (!warnedAboutProduction) {
      console.warn("DEMO_MODE is ignored in production; sign-in stays required.");
      warnedAboutProduction = true;
    }
    return false;
  }
  return true;
}

export const DEMO_USER = { email: "demo@hustle.local" } as const;
