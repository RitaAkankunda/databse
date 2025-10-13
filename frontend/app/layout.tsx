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
  description: "Professional asset tracking and management",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
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
