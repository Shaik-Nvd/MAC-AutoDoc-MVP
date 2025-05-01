"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/contexts/user-context"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    // Only redirect on the client side
    if (typeof window !== "undefined" && !isLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
