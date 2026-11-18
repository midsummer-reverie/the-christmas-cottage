import type { Metadata } from "next";
import "./globals.css";
import "./theme.css";
import { MusicProvider } from "@/components/music-provider";

export const metadata: Metadata = {
  title: "The Christmas Cottage",
  description: "กระท่อมเล็ก ๆ ที่เต็มไปด้วยเวทมนตร์คริสต์มาส",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body><MusicProvider>{children}</MusicProvider></body></html>;
}
