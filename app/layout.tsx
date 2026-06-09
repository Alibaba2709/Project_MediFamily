import type { Metadata, Viewport } from "next";
import { MobileBottomNav } from "@/app/components/MobileBottomNav";
import "./globals.css";

const siteUrl = new URL(
  process.env.NEXT_PUBLIC_APP_URL || "https://www.medifamilyapp.it"
);

export const preferredRegion = "fra1";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "MediFamily | La salute della famiglia organizzata",
    template: "%s | MediFamily",
  },
  description:
    "MediFamily organizza visite, ricette, farmaci, documenti sanitari e promemoria per ogni membro del nucleo familiare.",
  applicationName: "MediFamily",
  authors: [{ name: "MediFamily" }],
  alternates: {
    canonical: "/",
  },
  keywords: [
    "MediFamily",
    "salute famiglia",
    "promemoria visite mediche",
    "ricette mediche",
    "farmaci famiglia",
    "archivio salute",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MediFamily",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "256x256" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "MediFamily | La salute della famiglia organizzata",
    description:
      "Gestisci visite, scadenze, ricette, farmaci e documenti sanitari del tuo nucleo familiare.",
    images: [
      {
        url: "/medifamily-logo.png",
        width: 1254,
        height: 1254,
        alt: "Logo MediFamily",
      },
    ],
    locale: "it_IT",
    siteName: "MediFamily",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "MediFamily | La salute della famiglia organizzata",
    description:
      "Gestisci visite, scadenze, ricette, farmaci e documenti sanitari del tuo nucleo familiare.",
    images: ["/medifamily-logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#fffaf6",
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
