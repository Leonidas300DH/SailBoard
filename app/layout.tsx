import type { Metadata } from "next";
import { Barlow_Condensed, Geist, Geist_Mono } from "next/font/google";
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

const barlowCondensed = Barlow_Condensed({
  variable: "--font-race",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000"),
  title: { default: "SailBoard — la course au point près", template: "%s — SailBoard" },
  description: "Courses, parcours, équipages et classements de voile réunis dans un cockpit de compétition.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "SailBoard — la course au point près",
    description: "Suivez les courses, les bateaux et les équipages depuis un cockpit de compétition.",
    type: "website",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "SailBoard — Race, Crew, Results" }],
  },
  twitter: { card: "summary_large_image", title: "SailBoard — la course au point près", description: "Courses, parcours, équipages et classements de voile.", images: ["/og.png"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${barlowCondensed.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
