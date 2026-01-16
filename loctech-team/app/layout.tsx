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
    default: "Loctech Team | Attendance & Notifications",
    template: "%s | Loctech Team",
  },
  description:
    "Loctech Team is a modern attendance and notification platform for teams. Scan QR codes, manage sign-ins, and receive real-time updates.",
  keywords: [
    "attendance",
    "Team",
    "loctech",
    "QR code",
    "sign-in",
    "team management",
    "notifications",
    "slack integration",
    "admin dashboard",
  ],
  authors: [{ name: "Loctech Team", url: "https://loctech.com" }],
  creator: "Loctech Team",
  openGraph: {
    title: "Loctech Team | Attendance & Notifications",
    description:
      "Scan QR codes, manage sign-ins, and receive real-time notifications with Loctech Team.",
    url: "https://loctech.com",
    siteName: "Loctech Team",
    images: [
      {
        url: "/logo/favicon-96x96.png",
        width: 96,
        height: 96,
        alt: "Loctech Team Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Loctech Team | Attendance & Notifications",
    description:
      "Scan QR codes, manage sign-ins, and receive real-time notifications with Loctech Team.",
    images: ["/logo/favicon-96x96.png"],
    creator: "@loctech",
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
