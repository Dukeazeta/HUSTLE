import { NextResponse } from "next/server";
import type { ZodError, ZodType, output } from "zod";
import { auth } from "@/auth";
import { DEMO_USER, isDemoMode } from "@/lib/demo";
import { UserError } from "@/lib/errors";

export { UserError };

export const GENERIC_ERROR = "Something went wrong. Your saved data is unchanged.";

export async function requireUser() {
  if (isDemoMode()) return { email: DEMO_USER.email };
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  return { email };
}

export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export function notConfigured(service: string) {
  if (isDemoMode())
    return NextResponse.json({ error: "Demo data is read-only" }, { status: 403 });
  return NextResponse.json({ error: `${service} is not configured` }, { status: 503 });
}

function describeZodError(error: ZodError) {
  const issue = error.issues[0];
  if (!issue) return "The request is invalid.";
  const field = issue.path.join(".");
  return field ? `Invalid ${field}: ${issue.message}` : issue.message;
}

/**
 * Parses a JSON request body. Bad JSON or failed validation become a UserError
 * with a readable message. Pass `fallback` for routes whose body is optional.
 */
export async function parseBody<T extends ZodType>(
  request: Request,
  schema: T,
  fallback?: unknown,
): Promise<output<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    if (fallback === undefined)
      throw new UserError("The request body is not valid JSON.");
    body = fallback;
  }
  const result = schema.safeParse(body);
  if (!result.success) throw new UserError(describeZodError(result.error));
  return result.data;
}

export function apiError(error: unknown, fallback = GENERIC_ERROR) {
  if (error instanceof UserError)
    return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
