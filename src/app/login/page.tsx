import {
  ArrowRight,
  LockKeyhole,
  MessageSquareText,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { isDemoMode } from "@/lib/demo";
import Link from "next/link";
import { Mark } from "@/components/marketing/wordmark";
import styles from "./page.module.css";

export default async function Login() {
  if (isDemoMode()) redirect("/dashboard");
  const session = await auth();
  if (session?.user?.email) redirect("/dashboard");

  return (
    <main className={styles.page}>
      <section className={styles.editorial}>
        <Link href="/" className={styles.wordmark} aria-label="HUSTLE home">
          <Mark />
          HUSTLE
        </Link>
        <div className={styles.editorialCopy}>
          <h1>
            Evidence first. <span>Every message human.</span>
          </h1>
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
          <h2 id="login-title">Sign in to HUSTLE</h2>
          <p>Use any Google account. New accounts get a private workspace.</p>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
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
