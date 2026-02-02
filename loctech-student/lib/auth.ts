import bcrypt from "bcryptjs";

import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/db";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { User } from "@/types";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { StudentModel } from "@/backend/models/students.model";

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

const cookiePrefix = process.env.NODE_ENV === "production" ? "__Secure-" : "";
export const authConfig: NextAuthOptions = {
  // Secret for Next-auth, without this JWT encryption/decryption won't work
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        path: "/",
        sameSite: "lax", // Recommended for cross-subdomain usage
        secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        domain:
          process.env.NODE_ENV === "production"
            ? `.${process.env.NEXT_PUBLIC_MAIN_DOMAIN?.replace(/^\.?/, "")}`
            : undefined,
        // add a . in front so that subdomains are included
      },
    },
    csrfToken: {
      name: `${cookiePrefix}next-auth.csrf-token`,
      options: {
        path: "/",
        sameSite: "lax", // Recommended for cross-subdomain usage
        secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        domain:
          process.env.NODE_ENV === "production"
            ? `.${process.env.NEXT_PUBLIC_MAIN_DOMAIN?.replace(/^\.?/, "")}`
            : undefined, // add a . in front so that subdomains are included
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Sign in",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "example@email.com",
          required: true,
        },
        password: {
          label: "Password",
          type: "password",
          required: true,
        },
      },
      async authorize(credentials) {
        if (!credentials || !credentials.email || !credentials.password) {
          return null;
        }
        await connectToDatabase();
        // await StudentModel.updateMany({}, {
        //   passwordHash: await hashPassword('password123')
        // })
        const email = String(credentials.email).toLowerCase();
        const user = await StudentModel.findOne({ email });

        if (!user || !user.passwordHash) {
          return Promise.reject(new Error("Invalid email or password"));
        }
        if (user.status !== "active") {
          return Promise.reject(new Error("User account is inactive"));
        }
        const valid = await verifyPassword(
          String(credentials.password),
          user.passwordHash
        );
        if (!valid)
          return Promise.reject(new Error("Invalid email or password"));

        return {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: "student" as const,
          isActive: user.status === "active",
          phone: user.phone ?? "",
          createdAt: user.createdAt,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  // session: {
  //   strategy: "jwt",
  //   maxAge: 30 * 24 * 60 * 60, // 30 days
  // },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.type === "credentials" && user.id) {
        try {
          const email = String(user.email).toLowerCase();
          const userModel = await StudentModel.findOne(
            { email },
            { passwordHash: 0, __v: 0 }
          );

          console.log({ user });
          if (!userModel || userModel.status !== "active") {
            return Promise.reject(new Error("User not registered or inactive"));
          }
          const data = () => {
            const formatted: User = {
              id: String(userModel._id),
              name: userModel.name,
              email: userModel.email,
              role: "student" as const,
              isActive: userModel.status === "active",
              phone: userModel.phone ?? "",
              createdAt: userModel.createdAt,
            };
            return { user: formatted };
          };
          Object.assign(user, data());
          return true;
          // eslint-disable-next-line
        } catch (error) {
          return Promise.reject(new Error("Error signing in."));
        }
      }

      if (account?.provider === "google") {
        try {
          const email = String(user.email).toLowerCase();
          const userModel = await StudentModel.findOne(
            { email },
            { passwordHash: 0, __v: 0 }
          );
          if (!userModel || userModel.status !== "active") {
            return Promise.reject(new Error("User not registered or inactive"));
          }
          const data = () => {
            const formatted: User = {
              id: String(userModel._id),
              name: userModel.name,
              email: userModel.email,
              role: "student" as const,
              isActive: userModel.status === "active",
              phone: userModel.phone ?? "",
              createdAt: userModel.createdAt,
            };
            return { user: formatted };
          };
          Object.assign(user, data());
          return true;
          // eslint-disable-next-line
        } catch (error) {
          return Promise.reject(new Error("Error signing in with Google"));
        }
      }
      return false;
    },
    async jwt({ token, user }) {
      const newtoken = { ...token, ...user };

      return newtoken;
    },
    async session({ session, token }) {
      await connectToDatabase();
      const userModel = await StudentModel.findById((token.user as User)?.id);

      if (!userModel) {
        return Promise.reject(new Error("User not registered"));
      }
      const user: User = {
        id: String(userModel._id),
        name: userModel.name,
        email: userModel.email,
        role: "student" as const,
        isActive: userModel.status === "active",
        phone: userModel.phone ?? "",
        createdAt: userModel.createdAt,
      };
      return {
        ...session,
        user: user,
      };
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
};
const secret = process.env.NEXTAUTH_SECRET;

export async function isAuthenticated(req: NextRequest) {
  // getToken works in Middleware & API routes
  const token = await getToken({ req, secret });

  // token is `null` if not signed in
  return !!token;
}
