/**
 * Auth — نظام حسابات متعدد المستخدمين
 * - GitHub OAuth عبر Auth.js (next-auth v5)
 * - كلمة مرور عامة اختيارية للوصول السريع
 * - حماية routes الـ API والـ Sandbox
 */
import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: { params: { scope: "repo read:user user:email" } },
    }),
    Credentials({
      name: "كلمة المرور",
      credentials: {
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        const expected = process.env.OPENCODE_SERVER_PASSWORD;
        if (!expected) return null;
        const ok = credentials?.password === expected || (await bcrypt.compare(String(credentials?.password ?? ""), expected));
        if (!ok) return null;
        return { id: "password-user", name: "مستخدم محمي", email: "protected@local" };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub) (session.user as unknown as { id: string }).id = token.sub;
      return session;
    },
    async jwt({ token, account }) {
      if (account?.access_token) (token as unknown as { githubToken: string }).githubToken = account.access_token;
      return token;
    },
  },
  session: { strategy: "jwt" },
  trustHost: true,
};

export function requireAuthMessage() {
  return { error: "غير مصرح — سجّل الدخول أولاً", code: "UNAUTHORIZED" as const };
}
