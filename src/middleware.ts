import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";

// نحمي /dashboard و /api/sandbox/*
// السماح بالدخول المجهول لـ /dashboard في MVP — فعّل الحماية الكاملة بإزالة التعليق
export const middleware = NextAuth(authConfig).auth;

export const config = {
  matcher: ["/api/sandbox/:path*"],
};
