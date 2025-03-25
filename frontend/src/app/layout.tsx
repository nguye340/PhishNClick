import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Press_Start_2P, VT323, Silkscreen } from "next/font/google"
import { ClientLayout } from "@/components/client-layout"
import "./globals.css"
import '@/styles/rive-character.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-arcade",
})
const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-terminal",
})
const silkscreen = Silkscreen({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
})

export const metadata: Metadata = {
  title: "PhishNClick",
  description: "Master the art of detecting phishing attempts through interactive gameplay",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClientLayout 
      inter={inter} 
      pressStart2P={pressStart2P}
      vt323={vt323}
      silkscreen={silkscreen}
    >
      {children}
    </ClientLayout>
  )
}
