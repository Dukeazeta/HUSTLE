import type { Metadata } from "next";
import { Geist_Mono, Inter, Libre_Baskerville } from "next/font/google";
import "./globals.css";

// Inter's optical-size axis gives Inter Display at large sizes.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  axes: ["opsz"],
});

// Stand-in for Tiempos Text until licensed files are added.
const serif = Libre_Baskerville({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "HUSTLE", template: "%s | HUSTLE" },
  description:
    "Find local businesses that need a better website, prove it with an audit, and pitch them yourself.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${geistMono.variable} ${serif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
