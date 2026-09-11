import type { Metadata } from "next";
import "./globals.css";
import "./production-polish.css";
import "./store-font.css";
import "./storefront.css";
import "./catalog-polish.css";
import "./noto-font.css";
import "./store-design.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

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
    "маркетинг хэрэгсэл",
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
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster />
        <SonnerToaster richColors position="top-center" />
      </body>
    </html>
  );
}
