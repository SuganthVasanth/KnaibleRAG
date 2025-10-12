"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, Send, User, ArrowLeft, AlertCircle, Bug, Database, FileText, Trash2 } from "lucide-react"
import Link from "next/link"
import { AuthWrapper } from "@/components/auth-wrapper"
import { useAuth } from "@/contexts/auth-context"
import { useChat } from "@/contexts/chat-context"
import { Badge } from "@/components/ui/badge"

interface DebugInfo {
  documentsInDatabase: number
  chunksFound: number
  searchQuery: string
  userId: string
}

export default function ChatPage() {
  const { user } = useAuth()
  const { messages, addMessage, clearMessages, isLoading, setIsLoading } = useChat()
  const [input, setInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const checkDebugInfo = async () => {
    try {
      const response = await fetch(`/api/debug?userId=${user?.id || "demo-user-1"}`)
      const data = await response.json()
      setDebugInfo({
        documentsInDatabase: data.count || 0,
        chunksFound: data.searchResults?.length || 0,
        searchQuery: "test",
        userId: user?.id || "demo-user-1",
      })
    } catch (error) {
      console.error("Error fetching debug info:", error)
    }
  }

  useEffect(() => {
    checkDebugInfo()
  }, [user?.id])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = {
      id: Date.now().toString(),
      content: input,
      role: "user" as const,
      timestamp: new Date(),
    }

    addMessage(userMessage)
    const currentInput = input
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      console.log(`Sending message to API with userId: ${user?.id || "demo-user-1"}`)

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          userId: user?.id || "demo-user-1",
          model: "llama3-8b-8192",
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I'm sorry, I couldn't process your request. Please try again.",
        role: "assistant" as const,
        timestamp: new Date(),
        sources: data.sources || [],
      }

      addMessage(assistantMessage)
      await checkDebugInfo()
    } catch (error) {
      console.error("Error sending message:", error)
      setError((error as Error).message || "An error occurred while processing your request")

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, there was an error processing your request. Please check your connection and try again.",
        role: "assistant" as const,
        timestamp: new Date(),
      }
      addMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to safely format timestamps
  const formatTimestamp = (timestamp: Date | string): string => {
    if (!timestamp) return ""

    try {
      // If it's a string, convert to Date
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
      return date.toLocaleTimeString()
    } catch (error) {
      console.error("Error formatting timestamp:", error)
      return ""
    }
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Bot className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-semibold">RAG Chat Assistant</span>
                <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">Live AI</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-500">User: {user?.username || "Guest"}</div>
              <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)}>
                <Bug className="h-4 w-4 mr-1" />
                Debug
              </Button>
              <Button variant="outline" size="sm" onClick={clearMessages}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 max-w-4xl min-h-[calc(100vh-120px)] flex flex-col">
          {/* Debug Panel */}
          {showDebug && debugInfo && (
            <Card className="mb-4 border-orange-200 bg-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  Debug Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">User ID:</span> {debugInfo.userId}
                  </div>
                  <div>
                    <span className="font-medium">Documents Found:</span>{" "}
                    <Badge variant={debugInfo.documentsInDatabase > 0 ? "default" : "destructive"}>
                      {debugInfo.documentsInDatabase}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Chunks Available:</span>{" "}
                    <Badge variant={debugInfo.chunksFound > 0 ? "default" : "destructive"}>
                      {debugInfo.chunksFound}
                    </Badge>
                  </div>
                  <div>
                    <Button variant="outline" size="sm" onClick={checkDebugInfo}>
                      Refresh
                    </Button>
                  </div>
                </div>
                {debugInfo.documentsInDatabase === 0 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    ⚠️ No documents found! Go to Dashboard → Documents tab to upload some documents first.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-blue-600" />
                  Document Q&A Assistant
                </div>
                <Badge variant="outline">{messages.length} messages</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea
                className="flex-1 p-4 overflow-y-auto"
                ref={scrollAreaRef}
                style={{ maxHeight: "calc(100vh - 300px)" }}
              >
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-3 ${
                        message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>

                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500 flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              Sources: {message.sources.join(", ")}
                            </p>
                          </div>
                        )}

                        <p className={`text-xs mt-2 ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
                          {formatTimestamp(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500">Analyzing documents...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <AlertCircle className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-red-50 text-red-700 rounded-lg p-3">
                        <p>Error: {error}</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question about your uploaded documents..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Try: "give me a title", "what skills does reading improve?", "how does reading reduce stress?"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthWrapper>
  )
}
