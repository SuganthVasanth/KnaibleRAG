import { type NextRequest, NextResponse } from "next/server"
import { extractTextFromFile } from "@/lib/document-processor"
import { chunkText, storeDocumentChunks } from "@/lib/vector-db"
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

    // Extract text from file
    console.log(`📄 [API] Extracting text from ${file.name}`)
    const content = await extractTextFromFile(file)
    console.log(`📄 [API] Extracted ${content.length} characters`)

    // Check if we have enough content
    if (content.length < 50) {
      console.log(`⚠️ [API] Extracted content is too short: ${content.length} characters`)
      return NextResponse.json(
        {
          error:
            "The extracted content is too short or could not be properly extracted. For PDFs, please try using the manual text entry option.",
        },
        { status: 400 },
      )
    }

    // Chunk the content
    console.log(`🔪 [API] Chunking content`)
    const chunks = await chunkText(content)
    console.log(`🔪 [API] Created ${chunks.length} chunks`)

    // Generate document ID
    const documentId = Math.random().toString(36).substr(2, 9)
    console.log(`📄 [API] Generated document ID: ${documentId}`)

    // Store document in database (in-memory for demo)
    console.log(`💾 [API] Storing document in database`)
    const document = await db.documents.create({
      userId: actualUserId,
      filename: file.name,
      content,
      chunks,
      status: "processing",
    })
    console.log(`✅ [API] Document stored in database with ID: ${document.id}`)

    // Store chunks in vector database
    console.log(`🚀 [API] Storing chunks in vector database`)
    const stored = await storeDocumentChunks(actualUserId, documentId, chunks)
    console.log(`✅ [API] Vector storage result: ${stored}`)

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
      vectorStored: stored,
      userId: actualUserId,
      chunksCount: chunks.length,
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
