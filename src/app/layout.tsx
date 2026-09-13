import { ThemeProvider } from "@/components/site/theme-provider";
import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./theme.css";
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
  metadataBase: new URL(siteUrl()),
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "16x16 32x32 48x48 64x64 128x128 256x256" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/logo-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-icon.png",
  },
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
        <ThemeProvider>
        {children}
        <Toaster />
        <SonnerToaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
