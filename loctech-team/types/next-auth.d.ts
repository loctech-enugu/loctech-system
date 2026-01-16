// eslint-disable-next-line
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "admin" | "staff" | "super_admin";
      title?: string; // optional for super_admin
      isActive: boolean;
      phone: string;
      bankDetails: { [key: string]: unknown } | undefined;
      createdAt: Date;
      [key: string]: unknown; // This allows for additional properties...
    };
  }
}
