/* app/layout.tsx */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Toast (bildirim) ile ilgili satırları sildik.

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NexusAI Analyzer",
  description: "AI-Powered Brand Analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Modern görünüm için karanlık tema ekledik
    <html lang="en" className="dark"> 
      <body className={inter.className}>
        {children}
        {/* Toaster bileşenini buraya eklemiyoruz */}
      </body>
    </html>
  );
}