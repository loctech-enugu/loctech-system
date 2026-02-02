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
