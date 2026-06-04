import type { Metadata } from "next";
import { MobileBottomNav } from "@/app/components/MobileBottomNav";
import "./globals.css";

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
    <html lang="it" className="h-full antialiased">
      <body className="min-h-full flex flex-col pb-16 md:pb-0">
        {children}
        <MobileBottomNav />
      </body>
    </html>
  );
}
