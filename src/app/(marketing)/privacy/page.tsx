import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What HUSTLE stores, where its data comes from, and who can see it during the beta.",
};

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy"
      intro="What HUSTLE stores, where the data comes from, and who can see it."
    >
      <h2>Your account</h2>
      <p>
        You sign in with Google. HUSTLE stores your name, email address and profile picture
        from Google, plus the session that keeps you signed in. It doesn&apos;t see your
        Google password.
      </p>

      <h2>Your workspace</h2>
      <p>
        Campaigns, leads, audits, drafts, proposals and payment records you create belong to
        your private workspace. Other HUSTLE users can&apos;t see them.
      </p>

      <h2>Business data</h2>
      <ul>
        <li>Business listings come from Google Places when you run a search.</li>
        <li>
          Website findings and public contact details come from the business&apos;s own
          website.
        </li>
        <li>
          Web search (Brave Search) can suggest an official website or social profile. These
          are only used after you confirm them.
        </li>
      </ul>

      <h2>AI drafting</h2>
      <p>
        Audit summaries and pitch drafts are written by Google&apos;s Gemini. HUSTLE sends it
        the audit evidence with the business described anonymously, by category and
        country, not your past messages.
      </p>

      <h2>Opt-outs</h2>
      <p>
        When someone asks not to be contacted, HUSTLE keeps their email, phone, website or
        profile on a shared block list so no HUSTLE user can pitch them again. The list
        records which workspace added the opt-out.
      </p>

      <h2>What HUSTLE doesn&apos;t do</h2>
      <p>
        It doesn&apos;t send messages on your behalf, sell your data, or show your workspace
        to anyone else.
      </p>
    </LegalPage>
  );
}
