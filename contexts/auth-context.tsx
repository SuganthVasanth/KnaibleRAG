"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { sessionManager, type User } from "@/lib/simple-auth"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const savedUser = sessionManager.getSession()
    if (savedUser) {
      // Ensure user has an ID
      if (!savedUser.id) {
        savedUser.id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      setUser(savedUser)
    }
    setIsLoading(false)
  }, [])

  const login = (userData: User) => {
    // Ensure user has an ID
    if (!userData.id) {
      userData.id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    setUser(userData)
    sessionManager.setSession(userData)
  }

  const logout = () => {
    setUser(null)
    sessionManager.clearSession()
  }

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
