import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { NotificationProvider } from "@/components/notification-system";
import "./globals.css";
import RouteProgress from "@/components/route-progress"
import { NavigationProvider } from "@/lib/navigation"
import LivePollingProvider from "@/lib/live"

export const metadata: Metadata = {
  title: "Asset Management System",
  description: "Professional asset tracking and management system with comprehensive reporting and analytics",
  keywords: ["asset management", "inventory", "tracking", "analytics", "reporting"],
  authors: [{ name: "Asset Management Team" }],
  creator: "Asset Management System",
  publisher: "Asset Management System",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "Asset Management System",
    description: "Professional asset tracking and management system",
    url: "http://localhost:3000",
    siteName: "Asset Management System",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Asset Management System",
    description: "Professional asset tracking and management system",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen ${GeistSans.variable} ${GeistMono.variable}`}>
        <NotificationProvider>
          <LivePollingProvider>
            <NavigationProvider>
              <RouteProgress />
              <Suspense fallback={<div className="min-h-screen" />}>{children}</Suspense>
            </NavigationProvider>
          </LivePollingProvider>
          <Analytics />
        </NotificationProvider>
      </body>
    </html>
  );
}
