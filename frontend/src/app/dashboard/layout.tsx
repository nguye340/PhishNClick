"use client"

import React from "react"
import { CursorProvider } from "@/components/cursor/cursor-provider"

export default function DashboardLayout({
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
