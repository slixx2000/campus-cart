import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { siteUrl } from "@/lib/siteUrl";

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist",
  display: "swap",
});
import Header from "@/components/HeaderServer";
import Footer from "@/components/Footer";
import NotificationServer from "@/components/NotificationServer";
import PWARegister from "@/components/PWARegister";
import PWAInstallPopup from "@/components/PWAInstallPopup";
import MobileTabBar from "@/components/MobileTabBar";

const SITE_NAME = "CampusCart";
const TITLE = "CampusCart – The Student Marketplace for Zambian Campuses";
const DESCRIPTION =
  "Buy, sell and trade textbooks, electronics, clothing and services with verified students at your Zambian university. Free to post, student-only, no middleman.";

export const metadata: Metadata = {
  // Without this, every relative URL below (og image, canonical) resolves
  // against localhost in production and link previews come back blank.
  metadataBase: new URL(siteUrl()),
  title: {
    default: TITLE,
    // Pages set a bare title ("Sign In"); the brand is appended here rather
    // than hand-written into each one.
    template: "%s | CampusCart",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  keywords: [
    "student marketplace Zambia",
    "campus marketplace",
    "buy and sell textbooks Zambia",
    "university marketplace Lusaka",
    "ZCAS",
    "UNZA",
    "student classifieds Zambia",
    "second hand electronics Zambia",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    locale: "en_ZM",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "CampusCart" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "shopping",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
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
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-display antialiased bg-bg text-fg min-h-screen transition-colors">
        <PWARegister />
        <PWAInstallPopup />
        <Header />
        <main className="min-h-screen pb-16 md:pb-0">{children}</main>
        <Footer />
        <MobileTabBar />
        <NotificationServer />
      </body>
    </html>
  );
}
