import Link from "next/link";
import { SearchX } from "lucide-react";
import { SystemState } from "@/components/ui/system-state";

export default function NotFound() {
  return (
    <SystemState
      icon={<SearchX aria-hidden="true" />}
      eyebrow="Not found"
      title="This page isn’t here"
      body="The link may be old, or the item may have been removed from the workspace."
      actions={
        <>
          <Link href="/">Return to dashboard</Link>
          <Link href="/leads">Browse leads</Link>
        </>
      }
    />
  );
}
