import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#FF1493",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Impostor Word Guesser — Pink Edition 🌸🎭",
  description: "Social deduction word guessing game: everyone knows the secret word except the Impostor. Give one-word clues, deduce the word, trust no one!",
  keywords: ["impostor", "word game", "social deduction", "pink edition", "word guessing", "trivia", "among us word game"],
  authors: [{ name: "Impostor Pink Edition" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Impostor Word Guesser — Pink Edition 🌸🎭",
    description: "Social deduction word guessing: everyone knows the word except the Impostor. Give one-word clues, guess the word, trust no one!",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#1A0A0F] text-[#FFE4E1] selection:bg-[#FF1493] selection:text-white">
        {children}
      </body>
    </html>
  );
}
