import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { authSecret } from "@/lib/auth-config";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
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
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
