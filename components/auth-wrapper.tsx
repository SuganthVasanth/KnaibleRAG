"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Bot } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface AuthWrapperProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthWrapper({ children, requireAuth = true }: AuthWrapperProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (requireAuth && !isLoading && !isAuthenticated) {
      router.push("/auth/signin")
    }
  }, [isAuthenticated, isLoading, requireAuth, router])

  if (requireAuth && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return null
  }

  return <>{children}</>
}
