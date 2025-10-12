import { persistentStorage } from "./persistent-storage"

// Interfaces
interface User {
  id: string
  _is:string
  username: string
  email: string
  token:string
  createdAt: Date
}

interface Document {
  id: string
  userId: string
  filename: string
  content: string
  chunks: string[]
  uploadedAt: Date
  status: "processing" | "ready" | "error"
}

interface ChatMessage {
  id: string
  userId: string
  message: string
  response: string
  timestamp: Date
}

export const db = {
  users: {
    create: async (userData: Omit<User, "id" | "createdAt">) => {
      const user: User = {
        id: Math.random().toString(36).substr(2, 9),
        ...userData,
        createdAt: new Date(),
      }

      persistentStorage.addUser(user)
      return user
    },

    findByEmail: async (email: string) => {
      return persistentStorage.findUser(email)
    },

    findById: async (id: string) => {
      const users = persistentStorage.getUsers()
      return users.find((u) => u.id === id)
    },
  },

  documents: {
    create: async (docData: Omit<Document, "id" | "uploadedAt">) => {
      const doc: Document = {
        id: Math.random().toString(36).substr(2, 9),
        ...docData,
        uploadedAt: new Date(),
      }

      persistentStorage.addDocument(doc)
      console.log(`📄 [DB] Document created: ${doc.id} for user ${doc.userId}`)
      return doc
    },

    findByUserId: async (userId: string) => {
      const userDocs = persistentStorage.getDocuments(userId)
      console.log(`🔍 [DB] Found ${userDocs.length} documents for user ${userId}`)
      return userDocs
    },

    deleteById: async (id: string) => {
      const deleted = persistentStorage.deleteDocument(id)
      if (deleted) {
        console.log(`🗑️ [DB] Document deleted: ${id}`)
      }
      return deleted
    },

    getAll: async () => {
      return persistentStorage.getAllDocuments()
    },
  },

  chatHistory: {
    create: async (chatData: Omit<ChatMessage, "id" | "timestamp">) => {
      const message: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        ...chatData,
        timestamp: new Date(),
      }

      persistentStorage.addChatMessage(message)
      return message
    },

    findByUserId: async (userId: string) => {
      return persistentStorage.getChatHistory(userId)
    },
  },
}
