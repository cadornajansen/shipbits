import { Geist, Geist_Mono, Outfit } from "next/font/google"

import "./globals.css"
import type { Metadata } from "next"
import { cn } from "@/lib/utils";
import SiteHeader from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/footer"
import { Toaster } from "@/components/ui/sonner"
import { getSiteUrl } from "@/lib/site"

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

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
  title: { default: "ShipBits", template: "%s | ShipBits" },
  description: "See what Filipinos are shipping.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ShipBits",
    description: "Discover apps, tools, and products from Filipino builders.",
    url: "/",
    siteName: "ShipBits",
    locale: "en_PH",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "ShipBits", description: "Discover apps, tools, and products from Filipino builders." },
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable,
        outfit.variable,
      )}
    >
      <body className="flex min-h-screen flex-col bg-background font-sans antialiased" >
        <SiteHeader />
        {children}
        <SiteFooter />
        <Toaster />
      </body>
    </html>
  )
}
