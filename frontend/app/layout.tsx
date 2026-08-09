import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import AgentationWrapper from "./components/AgentationWrapper";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { ToastProvider } from "./components/Toast";

export const metadata: Metadata = {
  title: "Neko-ber — Smart Carpooling with Fare Negotiation",
  description: "Neko-ber connects riders and drivers on the same route. Book a seat, offer your car, and negotiate fares directly. No middlemen, no fixed prices.",
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
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </head>
      <body
        className="min-h-full flex flex-col bg-[#fcfaf5] text-[#1a3300] font-sans selection:bg-[#ffe95c] selection:text-[#1a3300]"
        suppressHydrationWarning
      >
        <AuthProvider>
          <AppProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AppProvider>
        </AuthProvider>
        <AgentationWrapper />
      </body>
    </html>
  );
}


