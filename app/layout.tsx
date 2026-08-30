import { Geist, Geist_Mono, Outfit } from "next/font/google"

import "./globals.css"
import type { Metadata, Viewport } from "next"
import { cn } from "@/lib/utils";
import SiteHeader from "@/components/layout/navbar";
import { Toaster } from "@/components/ui/sonner"

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
  title: "ShipBits",
  description: "See what Filipinos are shipping.",
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
      <body className="min-h-screen bg-background font-sans antialiased" >
        <SiteHeader />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
