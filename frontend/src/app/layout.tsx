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
    <html lang="en" className="dark">
      <body className="font-sans bg-arcade-bg text-foreground antialiased">
        <div className="relative min-h-screen">
          <ClientLayout>
            {children}
          </ClientLayout>
        </div>
      </body>
    </html>
  )
}
