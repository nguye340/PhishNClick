import type { Metadata } from "next"
import "./globals.css"
import '@/styles/rive-character.css'
import { ClientLayout } from "@/components/client-layout"

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
    <ClientLayout>
      {children}
    </ClientLayout>
  )
}
