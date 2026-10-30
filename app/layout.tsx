import type { Metadata } from "next"
import { Inter, Roboto_Mono } from "next/font/google"
import localFont from "next/font/local"

import "./globals.css"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { cn } from "@/lib/utils"
import { site } from "@/lib/site"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const fontMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
})

const saans = localFont({
  src: "../public/fonts/Saans-Medium.woff2",
  weight: "500",
  display: "swap",
  variable: "--font-saans",
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: "Shipbits — UI worth shipping",
  description:
    "Crafted React components, animated SVG icons, and materials. Explore the collection, customize in Studio, and make the source your own.",
  openGraph: {
    siteName: site.name,
    type: "website",
    locale: "en_US",
  },
  twitter: { card: "summary" },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactElement {
  return (
    <html
      lang="en"
      className={cn(
        "dark",
        "antialiased",
        fontMono.variable,
        "font-sans",
        "scroll-smooth text-base motion-reduce:scroll-auto max-sm:[--site-gutter:12px]!",
        inter.variable,
        saans.variable
      )}
    >
      <body className="min-h-dvh bg-[#121212] text-foreground">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
