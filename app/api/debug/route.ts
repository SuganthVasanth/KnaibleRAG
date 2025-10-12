import { NextResponse } from "next/server"
import { searchSimilarChunks, getAllChunksForUser } from "@/lib/vector-db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "demo-user-1"

    console.log(`🐛 Debug API called for userId: ${userId}`)

    // Get all chunks for this user
    const allChunks = await getAllChunksForUser(userId)
    console.log(`🐛 Found ${allChunks.length} total chunks for user ${userId}`)

    // Also do a test search
    const searchResults = await searchSimilarChunks(userId, "test", 10)
    console.log(`🐛 Search test found ${searchResults.length} results for user ${userId}`)

    // Check environment variables
    const envStatus = {
      upstash: !!(process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN),
      groq: !!process.env.GROQ_API_KEY,
    }

    return NextResponse.json({
      success: true,
      userId,
      allChunks,
      searchResults,
      count: allChunks.length,
      searchCount: searchResults.length,
      environment: envStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Debug API error:", error)
    return NextResponse.json(
      {
        error: "Error retrieving debug info",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
