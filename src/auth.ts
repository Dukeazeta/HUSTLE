import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";

const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret:
    process.env.AUTH_SECRET ??
    (process.env.DEMO_MODE === "true"
      ? "demo-only-secret-never-use-in-production"
      : undefined),
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  providers: [Google],
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    signIn({ profile }) {
      return Boolean(
        ownerEmail && profile?.email?.toLowerCase() === ownerEmail,
      );
    },
    authorized({ auth: session }) {
      if (process.env.DEMO_MODE === "true") return true;
      return session?.user?.email?.toLowerCase() === ownerEmail;
    },
  },
});
