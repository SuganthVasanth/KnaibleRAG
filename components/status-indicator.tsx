"use client"

import { Badge } from "@/components/ui/badge"
import { AlertCircle, Database, Zap } from "lucide-react"
import { useEffect, useState } from "react"

export function StatusIndicator() {
  const [status, setStatus] = useState({
    upstash: false,
    groq: false,
    loading: true,
  })

  useEffect(() => {
    // Check status via API instead of checking environment variables directly
    const checkStatus = async () => {
      try {
        const response = await fetch("/api/status")
        const data = await response.json()
        setStatus({
          upstash: data.upstash,
          groq: data.groq,
          loading: false,
        })
      } catch (error) {
        console.error("Error checking status:", error)
        setStatus((prev) => ({ ...prev, loading: false }))
      }
    }

    checkStatus()
  }, [])

  if (status.loading) {
    return (
      <div className="flex items-center space-x-2">
        <Badge variant="secondary" className="flex items-center space-x-1">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          <span>Checking...</span>
        </Badge>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <Badge variant={status.groq ? "default" : "secondary"} className="flex items-center space-x-1">
        {status.groq ? <Zap className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
        <span>{status.groq ? "Groq AI" : "AI Fallback"}</span>
      </Badge>
      <Badge variant={status.upstash ? "default" : "secondary"} className="flex items-center space-x-1">
        {status.upstash ? <Database className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
        <span>{status.upstash ? "Upstash Vector" : "Local Storage"}</span>
      </Badge>
    </div>
  )
}
