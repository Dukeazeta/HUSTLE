"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { SystemState } from "@/components/ui/system-state";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <SystemState
      icon={<AlertTriangle aria-hidden="true" />}
      title="Something went wrong"
      body="The workspace could not complete that request. Your saved data has not been changed."
      actions={
        <>
          <button onClick={reset}>Try again</button>
          <Link href="/dashboard">Return to dashboard</Link>
        </>
      }
    />
  );
}
