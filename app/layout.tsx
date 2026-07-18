import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Jost } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Jost is the closest open Futura — the WDT charte sets Futura Std Heavy for
// display and Futura light condensed caps for eyebrows.
const jost = Jost({
  variable: "--font-race",
  subsets: ["latin"],
  weight: ["300", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000"),
  title: { default: "SailBoard — le World Diam Tour au point près", template: "%s — SailBoard" },
  description: "Courses, parcours, équipages et classements de voile réunis dans un cockpit de compétition.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "SailBoard — le World Diam Tour au point près",
    description: "Suivez les étapes, les équipages et les navigateurs depuis un cockpit de compétition.",
    type: "website",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "SailBoard — Race, Crew, Results" }],
  },
  twitter: { card: "summary_large_image", title: "SailBoard — le World Diam Tour au point près", description: "Étapes, parcours, équipages, navigateurs et classements.", images: ["/og.png"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#030d14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jost.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
