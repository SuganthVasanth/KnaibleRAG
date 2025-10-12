"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date | string
  sources?: string[]
}

interface ChatContextType {
  messages: Message[]
  addMessage: (message: Message) => void
  clearMessages: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load chat history when user changes
  useEffect(() => {
    if (user?.id) {
      const chatKey = `knaible_chat_${user.id}`
      const savedChat = localStorage.getItem(chatKey)

      if (savedChat) {
        try {
          const parsedMessages = JSON.parse(savedChat)
          // Ensure timestamps are properly handled
          const processedMessages = parsedMessages.map((msg: any) => ({
            ...msg,
            // Keep timestamp as string to avoid serialization issues
            timestamp: msg.timestamp || new Date().toISOString(),
          }))
          setMessages(processedMessages)
          console.log(`📖 [CHAT] Loaded ${processedMessages.length} messages for user ${user.id}`)
        } catch (error) {
          console.error("❌ [CHAT] Error loading chat history:", error)
        }
      } else {
        // Set welcome message for new chat
        const welcomeMessage: Message = {
          id: "welcome",
          content: `Hello ${user.username}! I'm your AI assistant powered by Groq's free models. I can answer questions based on the documents you've uploaded. Upload some documents in the Dashboard first, then ask me questions about their content!`,
          role: "assistant",
          timestamp: new Date().toISOString(),
        }
        setMessages([welcomeMessage])
      }
    }
  }, [user?.id, user?.username])

  // Save chat history when messages change
  useEffect(() => {
    if (user?.id && messages.length > 0) {
      try {
        const chatKey = `knaible_chat_${user.id}`
        // Convert Date objects to strings for storage
        const messagesToStore = messages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
        }))
        localStorage.setItem(chatKey, JSON.stringify(messagesToStore))
        console.log(`💾 [CHAT] Saved ${messages.length} messages for user ${user.id}`)
      } catch (error) {
        console.error("❌ [CHAT] Error saving chat history:", error)
      }
    }
  }, [messages, user?.id])

  const addMessage = (message: Message) => {
    // Ensure timestamp is properly handled
    const processedMessage = {
      ...message,
      timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(),
    }
    setMessages((prev) => [...prev, processedMessage])
  }

  const clearMessages = () => {
    setMessages([])
    if (user?.id) {
      const chatKey = `knaible_chat_${user.id}`
      localStorage.removeItem(chatKey)
    }
  }

  const value = {
    messages,
    addMessage,
    clearMessages,
    isLoading,
    setIsLoading,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
