import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/HeaderServer";
import Footer from "@/components/Footer";
import NotificationServer from "@/components/NotificationServer";
import PWARegister from "@/components/PWARegister";
import PWAInstallPopup from "@/components/PWAInstallPopup";

export const metadata: Metadata = {
  title: "CampusCart – The Marketplace for Your Campus",
  description:
    "Buy, sell, and trade with students on your campus instantly. Secure, verified, and student-only.",
  manifest: "/manifest.webmanifest",
  applicationName: "CampusCart",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CampusCart",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var key='campuscart-theme';var stored=localStorage.getItem(key);var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var theme=stored||(prefersDark?'dark':'light');document.documentElement.classList.toggle('dark',theme==='dark');}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-display antialiased bg-background-light text-slate-900 min-h-screen transition-colors dark:bg-background-dark dark:text-slate-100">
        <PWARegister />
        <PWAInstallPopup />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <NotificationServer />
      </body>
    </html>
  );
}
