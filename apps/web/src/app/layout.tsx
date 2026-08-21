import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import { validateEnv } from "@/lib/env";
import { ServiceWorkerRegistration } from "@/components/layout/ServiceWorkerRegistration";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Et SHop!",
  description: "Gérez vos listes de courses en toute simplicité.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1A365D" },
    { media: "(prefers-color-scheme: dark)", color: "#16223a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  validateEnv();
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
