"use client"

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth.context";

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth?.accessToken) {
      router.replace("/unauthorized");
    }
  }, [auth, router]);

  if (!auth?.accessToken) return null;
  return <>{children}</>;
}
