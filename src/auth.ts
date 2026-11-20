import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { isDemoMode } from "@/lib/demo";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret:
    process.env.AUTH_SECRET ??
    (isDemoMode() ? "demo-only-secret-never-use-in-production" : undefined),
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
    signIn({ account, user }) {
      return account?.provider === "google" && Boolean(user.email);
    },
    authorized({ auth: session }) {
      return Boolean(session?.user?.email);
    },
    session({ session, user }) {
      // Database sessions leave the user id out by default; workspaces need it.
      if (session.user && user?.id) session.user.id = user.id;
      return session;
    },
  },
});
