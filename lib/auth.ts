import CredentialsProvider from "next-auth/providers/credentials";
import { AuthOptions } from "next-auth";
import clientPromise from "./mongodb";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials?.identifier || !credentials?.password) return null;

        const client = await clientPromise;
        const db = client.db("fantasy");

        const user = await db.collection("users").findOne({
          $or: [
            { email: credentials.identifier },
            { username: credentials.identifier },
          ],
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return { id: user._id.toString(), name: user.username, email: user.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id; // add user id to token
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string; // add id to session
      return session;
    },
  },
};

export default authOptions;
