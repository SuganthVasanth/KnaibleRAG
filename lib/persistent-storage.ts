// Enhanced persistent storage system
interface StorageData {
  users: any[]
  documents: any[]
  chatHistory: any[]
  lastUpdated: string
}

const STORAGE_KEY = "knaible_app_data"

class PersistentStorage {
  private data: StorageData = {
    users: [],
    documents: [],
    chatHistory: [],
    lastUpdated: new Date().toISOString(),
  }

  constructor() {
    this.loadData()
  }

  private loadData() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsedData = JSON.parse(stored)
          // Ensure all arrays exist
          this.data = {
            users: Array.isArray(parsedData.users) ? parsedData.users : [],
            documents: Array.isArray(parsedData.documents) ? parsedData.documents : [],
            chatHistory: Array.isArray(parsedData.chatHistory) ? parsedData.chatHistory : [],
            lastUpdated: parsedData.lastUpdated || new Date().toISOString(),
          }
          console.log(
            `📖 [STORAGE] Loaded data: ${this.data.users.length} users, ${this.data.documents.length} documents`,
          )
        }
      } catch (error) {
        console.error("❌ [STORAGE] Error loading data:", error)
        // Reset to default if corrupted
        this.data = {
          users: [],
          documents: [],
          chatHistory: [],
          lastUpdated: new Date().toISOString(),
        }
      }
    }
  }

  // Add this inside PersistentStorage class

updateUser(userId: string, updates: Partial<any>) {
  const user = this.data.users.find(u => u.id === userId)
  if (user) {
    Object.assign(user, updates) // merge updates into user
    this.saveData()
    console.log(`✅ [STORAGE] Updated user: ${user.username} (${user.id})`)
    return user
  } else {
    console.warn(`⚠️ [STORAGE] User not found: ${userId}`)
    return null
  }
}
  

  private saveData() {
    if (typeof window !== "undefined") {
      try {
        this.data.lastUpdated = new Date().toISOString()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data))
        console.log(`💾 [STORAGE] Data saved: ${this.data.users.length} users, ${this.data.documents.length} documents`)
      } catch (error) {
        console.error("❌ [STORAGE] Error saving data:", error)
      }
    }
  }

  // User operations
  addUser(user: any) {
    this.data.users.push(user)
    this.saveData()
    return user
  }

  findUser(identifier: string) {
    return this.data.users.find((u) => u.email === identifier || u.username === identifier)
  }

  getUsers() {
    return this.data.users
  }

  // Document operations
  addDocument(doc: any) {
    this.data.documents.push(doc)
    this.saveData()
    return doc
  }

  getDocuments(userId: string) {
    if (!Array.isArray(this.data.documents)) {
      this.data.documents = []
    }
    return this.data.documents.filter((d) => d.userId === userId)
  }

  deleteDocument(docId: string) {
    this.data.documents = this.data.documents.filter((d) => d.id !== docId)
    this.saveData()
    return true
  }

  getAllDocuments() {
    return this.data.documents
  }

  // Chat operations
  addChatMessage(message: any) {
    this.data.chatHistory.push(message)
    this.saveData()
    return message
  }

  getChatHistory(userId: string) {
    return this.data.chatHistory.filter((c) => c.userId === userId)
  }

  // Debug operations
  clearAllData() {
    this.data = {
      users: [],
      documents: [],
      chatHistory: [],
      lastUpdated: new Date().toISOString(),
    }
    this.saveData()
  }

  getDebugInfo() {
    return {
      totalUsers: this.data.users.length,
      totalDocuments: this.data.documents.length,
      totalChatMessages: this.data.chatHistory.length,
      lastUpdated: this.data.lastUpdated,
    }
  }
}

export const persistentStorage = new PersistentStorage()
