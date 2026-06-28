import type { Metadata, Viewport } from "next"
import { Quicksand, Poppins, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { AppAuthProvider } from "@/lib/auth"
import "./globals.css"

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "aqua studio — motion graphics editor",
  description:
    "Design bold animated title cards and multi-scene reels with a live Remotion preview, procedural pattern engine, and AI brand generation.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#FAFAFA",
  colorScheme: "light",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${quicksand.variable} ${poppins.variable} ${geistMono.variable}`}
    >
      <body className="bg-background font-sans antialiased">
        <AppAuthProvider>{children}</AppAuthProvider>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
