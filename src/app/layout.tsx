import type { Metadata } from "next";
import { Cinzel, Syne, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cloud-Flush | AWS Cloud Club VIT Chennai",
  description:
    "The ultimate cloud hackathon by AWS Cloud Club VIT Chennai. 24 hours. Infinite possibilities. One leaderboard.",
  keywords: ["hackathon", "AWS", "cloud", "VIT Chennai", "Cloud-Flush"],
  openGraph: {
    title: "Cloud-Flush | AWS Cloud Club VIT Chennai",
    description:
      "Where Code Meets Cloud. Where Ideas Become Infrastructure.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${cinzel.variable} ${syne.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <div className="noise-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
