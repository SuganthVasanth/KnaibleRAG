import { type NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { db } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    console.log(`📤 [API] Upload API called`)

    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    console.log(`📤 [API] File: ${file?.name}, User ID: ${userId}`)

    if (!file) {
      console.log(`❌ [API] No file provided`)
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Use provided userId or fall back to demo user
    const actualUserId = userId || "demo-user-1"
    console.log(`📤 [API] Using user ID: ${actualUserId}`)

    // Generate document ID
    const documentId = Math.random().toString(36).substr(2, 9)
    console.log(`📄 [API] Generated document ID: ${documentId}`)

    // Save file to public/uploaded_files
    const filename = `${actualUserId}_${file.name}`
    const filePath = join(process.cwd(), "public", "uploaded_files", filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    console.log(`💾 [API] File saved to ${filePath}`)

    // Store document in database (in-memory for demo)
    console.log(`💾 [API] Storing document in database`)
    const document = await db.documents.create({
      userId: actualUserId,
      filename: file.name,
      content: "", // No content extraction here, handled by vector service
      chunks: [],
      status: "processing",
    })
    console.log(`✅ [API] Document stored in database with ID: ${document.id}`)

    // Call vector service to embed the file
    console.log(`🚀 [API] Calling vector service to embed file`)
    const vectorFormData = new FormData()
    vectorFormData.append("user_id", actualUserId)
    vectorFormData.append("api_key", process.env.GROQ_API_KEY || "sk-demo-key") // Use env var or demo key
    vectorFormData.append("doc_id", documentId)
    vectorFormData.append("file", new Blob([buffer], { type: file.type }), file.name)

    const vectorResponse = await fetch("http://127.0.0.1:8000/upload_and_embed", {
      method: "POST",
      body: vectorFormData,
    })

    if (!vectorResponse.ok) {
      console.error(`❌ [API] Vector service error: ${vectorResponse.status}`)
      document.status = "error"
      return NextResponse.json(
        {
          error: "Failed to embed document in vector DB",
          details: `Vector service responded with ${vectorResponse.status}`,
        },
        { status: 500 },
      )
    }

    const vectorResult = await vectorResponse.json()
    console.log(`✅ [API] Vector embedding result:`, vectorResult)

    // Update document status to ready
    document.status = "ready"

    const response = {
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        uploadedAt: document.uploadedAt,
        status: document.status,
      },
      vectorStored: true,
      userId: actualUserId,
      chunksCount: vectorResult.num_chunks || 0,
    }

    console.log(`🎉 [API] Upload completed successfully:`, response)

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ [API] Upload API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
