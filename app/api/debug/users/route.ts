import { NextResponse } from "next/server"
import { authDB, User } from "@/lib/simple-auth"
import{persistentStorage} from "@/lib/persistent-storage"

export async function GET() {
  const users: User[] = persistentStorage.getUsers();

  try {
    console.log(`🐛 [DEBUG API] Users debug endpoint called`)

    let users :User[]= []
    try {
      users = await authDB.getAllUsers()
    } catch (error) {
      console.error("Error getting users:", error)
      users = []
    }

    console.log(`📊 [DEBUG API] Found ${users.length} users`)

    return NextResponse.json({
      success: true,
      totalUsers: Array.isArray(users) ? users.length : 0,
      users: Array.isArray(users)
        ? users.map((user) => ({
            id: user.id || "unknown-id",
            username: user.username || "unknown-user",
            email: user.email || "unknown-email",
            createdAt: user.createdAt || new Date().toISOString(),
          }))
        : [],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Debug users API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error retrieving users",
        details: (error as Error).message,
        totalUsers: 0,
        users: [],
      },
      { status: 500 },
    )
  }
}
