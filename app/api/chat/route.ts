  import { type NextRequest, NextResponse } from "next/server"
  import { generateRAGResponse } from "@/lib/rag-service"

  export async function POST(request: NextRequest) {
    try {
      console.log(`📥 [CHAT API] Received chat request`)

      const { message, model = "llama3-8b-8192", userId } = await request.json()
      console.log(`📥 [CHAT API] Message: "${message}", Model: ${model}, User ID: ${userId}`)

      if (!message) {
        console.log(`❌ [CHAT API] No message provided`)
        return NextResponse.json({ error: "Message is required" }, { status: 400 })
      }

      // Use the provided userId or fall back to demo user
      const actualUserId = userId || "demo-user-1"
      console.log(`🔍 [CHAT API] Processing chat request for user: ${actualUserId}`)

      // Check if user has documents
      const debugResponse = await fetch(`${request.nextUrl.origin}/api/debug?userId=${actualUserId}`)
      const debugData = await debugResponse.json()

      if (debugData.count === 0) {
        return NextResponse.json({
          response:
            "I don't see any documents uploaded to your account yet. Please go to the Dashboard and upload some documents first, then I'll be able to answer questions about their content!",
        })
      }

      console.log(`📊 [CHAT API] User has ${debugData.count} document chunks available`)

      const response = await generateRAGResponse(actualUserId, message, model)
      console.log(`✅ [CHAT API] Generated response: ${response.substring(0, 100)}...`)

      return NextResponse.json({ response })
    } catch (error) {
      console.error("❌ [CHAT API] Error:", error)
      return NextResponse.json(
        {
          error: "Internal server error",
          response:
            "I'm sorry, I'm currently unable to process your request. Please check that your documents are uploaded and try again.",
        },
        { status: 500 },
      )
    }
  }
