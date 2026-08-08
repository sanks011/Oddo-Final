import type { Metadata } from "next";
import "./globals.css";
import AgentationWrapper from "./components/AgentationWrapper";

export const metadata: Metadata = {
  title: "Oddo Stock — Sketchbook-Density Inventory Control",
  description: "Modern, high-craft inventory management platform built with real-time stock tracking, low-stock warnings, multi-warehouse sync, and SKU analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Inter:wght@300;400;500;600;700&family=Roboto+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-[#fcfaf5] text-[#1a3300] font-sans selection:bg-[#ffe95c] selection:text-[#1a3300]"
        suppressHydrationWarning
      >
        {children}
        <AgentationWrapper />
      </body>
    </html>
  );
}


