import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: {
    default: "Prism — Civic Intelligence for Everyone",
    template: "%s | Prism",
  },
  description:
    "Free, open-source civic intelligence. Understand politics and policy without bias, tracking, or hidden persuasion.",
  openGraph: {
    type: "website",
    url: "https://prism-civic.vercel.app",
    title: "Prism — Civic Intelligence for Everyone",
    description:
      "Free, open-source civic intelligence. Understand politics and policy without bias, tracking, or hidden persuasion.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Prism — Civic Intelligence for Everyone",
      },
    ],
    siteName: "Prism",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prism — Civic Intelligence for Everyone",
    description:
      "Free, open-source civic intelligence. Understand politics and policy without bias, tracking, or hidden persuasion.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
