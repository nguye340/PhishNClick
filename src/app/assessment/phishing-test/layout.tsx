"use client"

import React from "react"
import { CursorProvider } from "@/components/cursor/cursor-provider"

export default function PhishingTestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CursorProvider>
      {children}
    </CursorProvider>
  )
}
