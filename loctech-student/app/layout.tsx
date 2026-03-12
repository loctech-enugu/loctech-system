import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Loctech Student Portal",
    template: "%s | Loctech Student",
  },
  description:
    "Loctech Student Portal - Access your classes, take exams, and manage your attendance.",
  keywords: [
    "student",
    "loctech",
    "exams",
    "attendance",
    "classes",
    "courses",
    "education",
  ],
  authors: [{ name: "Loctech", url: "https://loctech.com" }],
  creator: "Loctech",
  openGraph: {
    title: "Loctech Student | Attendance & Notifications",
    description:
      "Loctech Student Portal - Access your classes, take exams, and manage your attendance.",
    url: "https://loctech-student.vercel.app",
    siteName: "Loctech Student Portal",
    images: [
      {
        url: "/logo/favicon-96x96.png",
        width: 96,
        height: 96,
        alt: "Loctech Student Portal Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary",
    title: "Loctech Student Portal | Attendance & Notifications",
    description:
      "Loctech Student Portal - Access your classes, take exams, and manage your attendance.",
    images: ["/logo/favicon-96x96.png"],
    creator: "@onyedikaanagha_",
  },
  icons: {
    icon: "/logo/favicon.ico",
    shortcut: "/logo/favicon.ico",
    apple: "/logo/apple-touch-icon.png",
  },
  manifest: "/logo/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
