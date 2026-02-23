import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MEGA AI Proposal Generator",
  description: "Create branded proposals for AI-powered marketing services",
  keywords: "AI, marketing, proposals, SEO, paid ads, website development",
  authors: [{ name: "MEGA AI" }],
  robots: "noindex, nofollow", // Prevent indexing of proposal generator
  openGraph: {
    title: "MEGA AI Proposal Generator",
    description: "Create branded proposals for AI-powered marketing services",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}