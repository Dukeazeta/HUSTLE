import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function requireUser() {
  if (
    process.env.VERCEL_ENV === "production" &&
    process.env.DEMO_MODE === "true"
  )
    throw new Error("DEMO_MODE cannot be enabled in production");
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  return { email };
}

export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });
export const notConfigured = (service: string) =>
  NextResponse.json({ error: `${service} is not configured` }, { status: 503 });

export function apiError(error: unknown, fallback = "Request failed") {
  console.error(error);
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status: 400 });
}
