/** Marketing pages anyone can read without signing in. */
export const PUBLIC_PATHS = new Set([
  "/",
  "/how-it-works",
  "/pricing",
  "/privacy",
  "/terms",
]);

export function isPublicPath(pathname: string) {
  const normalised = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return PUBLIC_PATHS.has(normalised);
}
