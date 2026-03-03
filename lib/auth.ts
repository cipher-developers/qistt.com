import { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "./prisma";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@kistly.local" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[v0] authorize called with email:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log("[v0] missing credentials");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { tenant: true },
        });

        console.log("[v0] user found:", user?.email);
        if (!user) {
          console.log("[v0] user not found");
          return null;
        }

        const passwordMatch = await compare(credentials.password as string, user.password);
        console.log("[v0] password match:", passwordMatch);
        if (!passwordMatch) {
          console.log("[v0] password mismatch");
          return null;
        }

        const returnUser = {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenant?.name,
        };
        console.log("[v0] authorize returning user:", returnUser);
        return returnUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("[v0] jwt callback - user:", user?.email, "token:", token);
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
        token.tenantName = (user as any).tenantName;
        console.log("[v0] jwt callback - updated token:", token);
      }
      return token;
    },
    async session({ session, token }) {
      console.log("[v0] session callback - session:", session?.user?.email, "token:", token);
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).tenantName = token.tenantName;
        console.log("[v0] session callback - updated session:", session);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

import NextAuth from "next-auth";

const nextAuth = NextAuth(authConfig);

export const auth = nextAuth.auth;
export const GET = nextAuth.handlers.GET;
export const POST = nextAuth.handlers.POST;
