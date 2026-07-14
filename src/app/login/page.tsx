import { Sparkles } from "lucide-react";
import { signIn } from "@/auth";

export default function Login() {
  return <main className="login-page"><div className="login-card"><span className="brand-mark large"><Sparkles /></span><span className="eyebrow">Private workspace</span><h1>Welcome to HUSTLE</h1><p>Sign in with the allowlisted Google account to manage leads and outreach.</p><form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}><button className="primary-button full">Continue with Google</button></form><small>No public registration. No autonomous outreach.</small></div></main>;
}
