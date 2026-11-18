import type { Metadata } from "next";
import "./globals.css";
import "./theme.css";
import { MusicProvider } from "@/components/music-provider";

export const metadata: Metadata = {
  title: "The Christmas Cottage",
  description: "กระท่อมเล็ก ๆ ที่เต็มไปด้วยเวทมนตร์คริสต์มาส",
  icons: {
    icon: "https://iili.io/o2pUbig.md.png",
    shortcut: "https://iili.io/o2pUbig.md.png",
  },
  openGraph: {
    type: "website",
    title: "The Christmas Cottage",
    description: "กระท่อมเล็ก ๆ ที่เต็มไปด้วยเวทมนตร์คริสต์มาส",
    siteName: "The Christmas Cottage",
    locale: "th_TH",
    images: [{ url: "https://iili.io/o2pgJJR.png", alt: "The Christmas Cottage — a cozy Christmas hideaway" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Christmas Cottage",
    description: "กระท่อมเล็ก ๆ ที่เต็มไปด้วยเวทมนตร์คริสต์มาส",
    images: ["https://iili.io/o2pgJJR.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body><MusicProvider>{children}</MusicProvider></body></html>;
}
