import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "The ground rules for using HUSTLE during the free beta.",
};

export default function Terms() {
  return (
    <LegalPage title="Terms" intro="The ground rules for using HUSTLE during the free beta.">
      <h2>The beta</h2>
      <p>
        HUSTLE is free while it&apos;s in beta. Features, limits and planned prices can
        change, and the service may be unavailable at times. Each workspace has daily limits
        on searches, audits, drafts and web lookups.
      </p>

      <h2>You send the messages</h2>
      <p>
        HUSTLE drafts outreach, but you decide what to send and you send it from your own
        accounts. You&apos;re responsible for every message you send.
      </p>

      <h2>Follow the outreach rules</h2>
      <ul>
        <li>
          Follow the marketing and privacy laws that apply where you are and where the
          business is. In many places, contacting sole traders needs consent.
        </li>
        <li>Don&apos;t use HUSTLE for bulk or automated messaging.</li>
        <li>Respect every opt-out. HUSTLE blocks opted-out contacts for everyone.</li>
      </ul>

      <h2>Third-party data</h2>
      <p>
        Business listings come from Google and web results from Brave Search. Use them only
        for prospecting inside HUSTLE, and don&apos;t copy them out in bulk.
      </p>

      <h2>Fair use</h2>
      <p>
        Don&apos;t try to get around the daily limits, access other workspaces, or use
        HUSTLE to audit sites you have no prospecting reason to look at.
      </p>
    </LegalPage>
  );
}
