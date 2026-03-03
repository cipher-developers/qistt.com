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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { tenant: true },
        });

        if (!user) {
          return null;
        }

        const hashedPassword = (user as any).password ?? (user as any).passwordHash;
        if (!hashedPassword) {
          return null;
        }

        const passwordMatch = await compare(credentials.password as string, hashedPassword);
        if (!passwordMatch) {
          return null;
        }

        const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

        const returnUser = {
          id: user.id,
          email: user.email,
          name: fullName || user.email,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenant?.name,
        };
        return returnUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
        token.tenantName = (user as any).tenantName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).tenantName = token.tenantName;
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
