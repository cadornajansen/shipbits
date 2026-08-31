import { Geist, Geist_Mono, Outfit } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

import "./globals.css"
import type { Metadata, Viewport } from "next"
import { cn } from "@/lib/utils"
import SiteHeader from "@/components/layout/navbar"
import { SiteFooter } from "@/components/layout/footer"
import { Toaster } from "@/components/ui/sonner"
import { MotionProvider } from "@/components/motion/motion-provider"
import { PageEnter } from "@/components/motion/page-enter"
import {
  DEFAULT_OG_IMAGE_PATH,
  getSearchVerification,
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_LANGUAGE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_THEME_COLOR,
} from "@/lib/site"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit-family",
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "ShipBits - Discover Apps, SaaS & Products",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  creator: SITE_NAME,
  publisher: SITE_NAME,
  verification: getSearchVerification(),
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/feed.xml" },
  },
  openGraph: {
    title: "ShipBits - Discover Apps, SaaS & Products",
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    type: "website",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 4800,
        height: 2520,
        alt: "ShipBits product discovery directory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShipBits - Discover Apps, SaaS & Products",
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE_PATH],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { address: false, email: false, telephone: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: SITE_THEME_COLOR,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang={SITE_LANGUAGE}
      suppressHydrationWarning
      className={cn(
        "no-js",
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable,
        outfit.variable
      )}
    >
      <head>
        <style>{`
            .no-js [data-motion-reveal],
            .no-js [data-motion-page-enter] {
              opacity: 1 !important;
              transform: none !important;
            }
        `}</style>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'document.documentElement.classList.replace("no-js", "js")',
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-background font-sans antialiased">
        <MotionProvider>
          <SiteHeader />
          <PageEnter>{children}</PageEnter>
          <SiteFooter />
          <Toaster />
          <Analytics />
          <SpeedInsights />
        </MotionProvider>
      </body>
    </html>
  )
}
