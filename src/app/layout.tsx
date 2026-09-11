import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SOCIALTOOL.STORE — Social media & AI хэрэгслүүд нэг дор",
  description:
    "Facebook, Instagram, TikTok, Telegram, Twitter/X, Email, AI хэрэгслүүдийг нэг дороос аюулгүй, хурдан аваарай. Шуурхай хүргэлт, баталгаатай бүтээгдэхүүн.",
  keywords: [
    "social media tools",
    "MMO tools",
    "Facebook tool",
    "Instagram automation",
    "TikTok growth",
    "Telegram bot",
    "AI tool",
    "эх хэрэгсэл",
    " маркетинг хэрэгсэл",
  ],
  authors: [{ name: "SOCIALTOOL.STORE" }],
  openGraph: {
    title: "SOCIALTOOL.STORE",
    description: "Social media & AI хэрэгслүүд нэг дор",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
        <SonnerToaster richColors position="top-center" />
      </body>
    </html>
  );
}
