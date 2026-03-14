import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cloud-Flush | AWS Cloud Club VIT Chennai",
  description:
    "The ultimate cloud hackathon by AWS Cloud Club VIT Chennai. 24 hours. Infinite possibilities. One leaderboard.",
  keywords: ["hackathon", "AWS", "cloud", "VIT Chennai", "Cloud-Flush"],
  icons: {
    icon: "/awscc_logo.webp",
    apple: "/awscc_logo.webp",
  },
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
      <body className={`${spaceGrotesk.variable} antialiased`}>
        <div className="noise-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
