import {
  ArrowRight,
  LockKeyhole,
  MessageSquareText,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import styles from "./page.module.css";

export default async function Login() {
  const session = await auth();
  if (session?.user?.email) redirect("/");

  return (
    <main className={styles.page}>
      <section className={styles.editorial}>
        <strong className={styles.wordmark}>HUSTLE</strong>
        <div className={styles.editorialCopy}>
          <span>Private sales workspace</span>
          <h1>Evidence first. Every message human.</h1>
          <p>
            Discover businesses worldwide, verify the opportunity and keep
            outreach completely under your control.
          </p>
        </div>
        <div className={styles.productCard} aria-label="HUSTLE workflow">
          <WorkflowRow icon={<ScanSearch />} label="Review public evidence" />
          <WorkflowRow icon={<ShieldCheck />} label="Verify the contact" />
          <WorkflowRow icon={<MessageSquareText />} label="Approve every pitch" />
        </div>
      </section>

      <section className={styles.signIn} aria-labelledby="login-title">
        <div className={styles.signInInner}>
          <span className={styles.lock}>
            <LockKeyhole aria-hidden="true" />
          </span>
          <h2 id="login-title">Welcome back</h2>
          <p>Sign in with any Google account to open your workspace.</p>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button>
              Continue with Google
              <ArrowRight aria-hidden="true" />
            </button>
          </form>
          <small>Google sign-in only · Nothing is sent automatically</small>
        </div>
      </section>
    </main>
  );
}

function WorkflowRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div>
      <span>{icon}</span>
      <strong>{label}</strong>
      <small>Manual</small>
    </div>
  );
}
