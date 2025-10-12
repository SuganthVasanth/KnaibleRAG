// import { persistentStorage } from "./persistent-storage"

// // User interface
// interface User {
//   id: string
//   username: string
//   email: string
//   password: string
//   token:string
//   createdAt: Date
// }

// export const authDB = {
//   // Find user by email or username
//   findUser: async (identifier: string): Promise<User | null> => {
//     console.log(`🔍 [AUTH] Looking for user with identifier: ${identifier}`)

//     const user = persistentStorage.findUser(identifier)

//     if (user) {
//       console.log(`✅ [AUTH] Found user: ${user.username} (${user.email})`)
//     } else {
//       console.log(`❌ [AUTH] User not found with identifier: ${identifier}`)
//     }

//     return user || null
//   },

//   // Create new user
//   createUser: async (userData: { username: string; email: string; password: string }): Promise<User> => {
//     console.log(`📝 [AUTH] Creating new user: ${userData.username} (${userData.email})`)

//     const newUser: User = {
//       id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//       ...userData,
//       createdAt: new Date(),
//     }

//     persistentStorage.addUser(newUser)

//     console.log(`✅ [AUTH] User created successfully:`, {
//       id: newUser.id,
//       username: newUser.username,
//       email: newUser.email,
//     })

//     return newUser
//   },

//   // Verify credentials
//   verifyCredentials: async (identifier: string, password: string): Promise<User | null> => {
//     console.log(`🔐 [AUTH] Verifying credentials for: ${identifier}`)

//     const user = await authDB.findUser(identifier)
//     if (user && user.password === password) {
//       console.log(`✅ [AUTH] Authentication successful for: ${user.username}`)
//       return user
//     }

//     console.log(`❌ [AUTH] Authentication failed for: ${identifier}`)
//     return null
//   },

//   // Check if user exists
//   userExists: async (email: string, username: string): Promise<boolean> => {
//     const users = persistentStorage.getUsers()
//     return users.some((u) => u.email === email || u.username === username)
//   },

//   // Get all users (for debugging)
//   getAllUsers: async (): Promise<User[]> => {
//     return persistentStorage.getUsers().map((user) => ({
//       ...user,
//       password: "[HIDDEN]",
//     })) as User[]
//   },
// }

// // Enhanced session management
// export const sessionManager = {
//   setSession: (user: User) => {
//     if (typeof window !== "undefined") {
//       localStorage.setItem("knaible_user", JSON.stringify(user))
//       console.log(`💾 [SESSION] Session saved for user: ${user.username} (${user.id})`)
//     }
//   },

//   getSession: (): User | null => {
//     if (typeof window !== "undefined") {
//       const userData = localStorage.getItem("knaible_user")
//       if (userData) {
//         const user = JSON.parse(userData)
//         console.log(`📖 [SESSION] Session loaded for user: ${user.username} (${user.id})`)
//         return user
//       }
//     }
//     return null
//   },

//   clearSession: () => {
//     if (typeof window !== "undefined") {
//       localStorage.removeItem("knaible_user")
//       console.log(`🗑️ [SESSION] Session cleared`)
//     }
//   },
// }

// export type { User }
// lib/simple-auth.ts
import { persistentStorage } from "./persistent-storage"
import { v4 as uuidv4 } from "uuid" // npm install uuid

// User interface
interface User {
  id: string
  _id: string;
  username: string
  email: string
  password: string
  token: string
  createdAt: Date
}

export const authDB = {
  // Find user by email or username
  findUser: async (identifier: string): Promise<User | null> => {
    const user = persistentStorage.findUser(identifier)
    return user || null
  },

  // Create new user
  createUser: async (userData: { username: string; email: string; password: string }): Promise<User> => {
    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        _id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
      ...userData,
      createdAt: new Date(),
      token: uuidv4(), // assign a unique token
    }

    persistentStorage.addUser(newUser)
    return newUser
  },

  // Verify credentials and update token on login
  verifyCredentials: async (identifier: string, password: string): Promise<User | null> => {
    const user = await authDB.findUser(identifier)
    if (user && user.password === password) {
      // Generate a new token on login
      user.token = uuidv4()
      persistentStorage.updateUser(user.id,{ token: "some-token-value" }) // ensure this exists in persistentStorage
      return user
    }
    return null
  },

  // Check if user exists
  userExists: async (email: string, username: string): Promise<boolean> => {
    const users = persistentStorage.getUsers()
    return users.some((u) => u.email === email || u.username === username)
  },

  // Get all users (for debugging, password hidden)
  getAllUsers: async (): Promise<User[]> => {
    return persistentStorage.getUsers().map((user) => ({
      ...user,
      password: "[HIDDEN]",
    })) as User[]
  },
}

// Enhanced session management
export const sessionManager = {
  setSession: (user: User) => {
    if (typeof window !== "undefined") {
       const sessionUser = { ...user, _id: user._id || user.id }; 
      // localStorage.setItem("knaible_user", JSON.stringify(user))
      localStorage.setItem("knaible_user", JSON.stringify(sessionUser))
    }
  },

  getSession: (): User | null => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("knaible_user")
      if (userData) return JSON.parse(userData)
    }
    return null
  },

  clearSession: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("knaible_user")
    }
  },
}

export type { User }
