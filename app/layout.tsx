import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MobileBottomNav } from "@/app/components/MobileBottomNav";
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
  title: "MediFamily",
  description: "Dashboard familiare per visite, scadenze e documenti medici.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pb-16 md:pb-0">
        {children}
        <MobileBottomNav />
      </body>
    </html>
  );
}
