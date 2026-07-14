"use client";
import { AlertTriangle } from "lucide-react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="focused-stage">
      <span className="stage-illustration">
        <AlertTriangle />
      </span>
      <h1>Something went wrong</h1>
      <p>
        The workspace could not complete that request. Your saved data is
        unchanged.
      </p>
      <button className="primary-button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
