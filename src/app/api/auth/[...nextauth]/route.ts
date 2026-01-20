import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { authSecret } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  secret: authSecret,
  pages: {
    signIn: "/open/oauth",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // After successful sign in, redirect to /content
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/content`;
      }
      return `${baseUrl}/content`;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
